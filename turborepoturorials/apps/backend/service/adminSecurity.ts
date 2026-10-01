import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

/* =========================
   SETTINGS
========================= */
export const ADMIN_SESSION_COOKIE = 'admin_session';
export const ADMIN_LOGIN_COOKIE = 'admin_login';

export const SESSION_TTL_MS = 4 * 60 * 60 * 1000;   // admin session lasts 4 hours
export const LOGIN_TTL_MS = 10 * 60 * 1000;         // whole login challenge must finish in 10 minutes
export const OTP_TTL_MS = 5 * 60 * 1000;            // email code valid for 5 minutes
export const MAX_OTP_ATTEMPTS = 5;
export const MAX_FAILED_LOGINS = 5;
export const LOCK_TIME_MS = 15 * 60 * 1000;

const ISSUER = 'Obuya GrassRoots';

const jwtSecret = () => {
    const secret = process.env.ADMIN_JWT_SECRET;
    if (!secret || secret.length < 32) throw new Error('ADMIN_JWT_SECRET is missing or shorter than 32 characters');
    return secret;
};

const encryptionKey = () => {
    const key = process.env.ADMIN_2FA_ENCRYPTION_KEY;
    if (!key || key.length < 32) throw new Error('ADMIN_2FA_ENCRYPTION_KEY is missing or shorter than 32 characters');
    return crypto.createHash('sha256').update(key).digest();
};

/* Throws when the admin security settings are not configured */
export const assertConfigured = () => {
    jwtSecret();
    encryptionKey();
};

/* =========================
   COOKIES
========================= */
export const cookieOptions = (maxAge: number) => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge,
});

export const clearCookieOptions = () => {
    const { maxAge, ...rest } = cookieOptions(0);
    return rest;
};

/* =========================
   RANDOM VALUES & HASHING
========================= */
export const randomId = () => crypto.randomBytes(32).toString('hex');

export const generateOtp = () => crypto.randomInt(0, 1000000).toString().padStart(6, '0');

export const hashOtp = (adminId: string, nonce: string, otp: string) =>
    crypto.createHmac('sha256', jwtSecret()).update(`${adminId}:${nonce}:${otp}`).digest('hex');

export const hashSessionId = (sessionId: string) =>
    crypto.createHmac('sha256', jwtSecret()).update(sessionId).digest('hex');

export const safeEqual = (a: string, b: string) => {
    if (!a || !b) return false;
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

/* =========================
   ENCRYPTION (authenticator secrets at rest, AES-256-GCM)
========================= */
export const encrypt = (plain: string) => {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
    const data = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    return [iv, cipher.getAuthTag(), data].map(b => b.toString('base64')).join('.');
};

export const decrypt = (payload: string) => {
    const [iv, tag, data] = payload.split('.').map(p => Buffer.from(p, 'base64'));
    const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
};

/* =========================
   TOKENS
========================= */
export const signLoginToken = (adminId: string, nonce: string) =>
    jwt.sign({ id: adminId, nonce, typ: 'admin_login' }, jwtSecret(), {
        expiresIn: Math.floor(LOGIN_TTL_MS / 1000),
        issuer: ISSUER,
        audience: 'admin_login',
    });

export const verifyLoginToken = (token: string): { id: string, nonce: string } | null => {
    try {
        const decoded: any = jwt.verify(token, jwtSecret(), { issuer: ISSUER, audience: 'admin_login', algorithms: ['HS256'] });
        return decoded.typ === 'admin_login' ? decoded : null;
    } catch (error) {
        return null;
    }
};

export const signSessionToken = (adminId: string, role: string, sessionId: string) =>
    jwt.sign({ id: adminId, role, sid: sessionId, mfa: true, typ: 'admin_session' }, jwtSecret(), {
        expiresIn: Math.floor(SESSION_TTL_MS / 1000),
        issuer: ISSUER,
        audience: 'admin_session',
    });

export const verifySessionToken = (token: string): { id: string, sid: string } | null => {
    try {
        const decoded: any = jwt.verify(token, jwtSecret(), { issuer: ISSUER, audience: 'admin_session', algorithms: ['HS256'] });
        return decoded.typ === 'admin_session' && decoded.mfa === true ? decoded : null;
    } catch (error) {
        return null;
    }
};

/* =========================
   HELPERS
========================= */
export const maskEmail = (email: string) => {
    const [name, domain] = email.split('@');
    return `${name.slice(0, 2)}${'*'.repeat(Math.max(name.length - 2, 3))}@${domain}`;
};

export const issuerName = ISSUER;

/* =========================
   EMAIL OTP
========================= */
export const sendOtpEmail = async (to: string, otp: string) => {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Email service is not configured');
        }
        // Development only: SMTP is not set up, print the code in the server console
        console.log(`[DEV ONLY] Admin login code for ${to}: ${otp}`.yellow);
        return;
    }

    const transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT) || 587,
        secure: Number(SMTP_PORT) === 465,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    await transporter.sendMail({
        from: SMTP_FROM || SMTP_USER,
        to,
        subject: `${ISSUER} admin login code`,
        text: `Your ${ISSUER} admin login code is ${otp}. It expires in 5 minutes.\n\nIf you did not try to sign in, change your admin password immediately.`,
        html: `<p>Your <b>${ISSUER}</b> admin login code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${otp}</p><p>It expires in 5 minutes.</p><p>If you did not try to sign in, change your admin password immediately.</p>`,
    });
};
