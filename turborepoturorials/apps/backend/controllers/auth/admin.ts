import bcrypt from 'bcryptjs';
import QRCode from 'qrcode';
import { generateSecret, generateURI, verify as verifyTotp } from 'otplib';
import { Admin } from '@repo/database';
import {
    ADMIN_LOGIN_COOKIE, ADMIN_SESSION_COOKIE, LOCK_TIME_MS, LOGIN_TTL_MS, MAX_FAILED_LOGINS, MAX_OTP_ATTEMPTS,
    OTP_TTL_MS, SESSION_TTL_MS, assertConfigured, clearCookieOptions, cookieOptions, decrypt, encrypt, generateOtp,
    hashOtp, hashSessionId, issuerName, maskEmail, randomId, safeEqual, sendOtpEmail, signLoginToken,
    signSessionToken, verifyLoginToken, verifySessionToken,
} from '../../service/adminSecurity';

const controller: any = {};

// Used to compare against when the email does not exist, so response time does not reveal valid emails
const DUMMY_HASH = bcrypt.hashSync('obuya-grassroots-dummy-password', 12);

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/;

const LOGIN_FIELDS = '+loginNonce +loginStage +loginExpiry +failedLoginAttempts +lockUntil';

/* =========================
   HELPERS
========================= */
const fail = (res: any, message: string, extra: any = {}) =>
    res.status(200).json({ status: false, message, ...extra });

const isLocked = (admin: any) => admin.lockUntil && admin.lockUntil.getTime() > Date.now();

const lockedMessage = (admin: any) =>
    `Too many failed attempts. Try again after ${Math.ceil((admin.lockUntil.getTime() - Date.now()) / 60000)} minute(s).`;

// Counts a failed factor. After too many failures the account is locked and the login challenge is cancelled
const registerFailure = async (admin: any) => {
    const attempts = (admin.failedLoginAttempts || 0) + 1;
    const update: any = { failedLoginAttempts: attempts };
    if (attempts >= MAX_FAILED_LOGINS) {
        update.failedLoginAttempts = 0;
        update.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
        update.$unset = { loginNonce: 1, loginStage: 1, loginExpiry: 1, otpHash: 1, otpExpiry: 1, totpPendingSecret: 1 };
    }
    await Admin.updateOne({ _id: admin._id }, update);
    return attempts >= MAX_FAILED_LOGINS;
};

const clearLoginChallenge = (res: any) => res.clearCookie(ADMIN_LOGIN_COOKIE, clearCookieOptions());

// Loads the admin behind the login cookie, only while the challenge is still valid
const getLoginChallenge = async (req: any, extraFields = '') => {
    const token = req.cookies?.[ADMIN_LOGIN_COOKIE];
    const decoded = token ? verifyLoginToken(token) : null;
    if (!decoded) return null;

    const admin: any = await Admin.findOne({ _id: decoded.id, isDeleted: false }).select(`${LOGIN_FIELDS} ${extraFields}`);
    if (!admin || !safeEqual(admin.loginNonce, decoded.nonce)) return null;
    if (!admin.loginExpiry || admin.loginExpiry.getTime() < Date.now()) return null;
    return admin;
};

/* =========================
   REGISTER
========================= */
controller.register = async (req: any, res: any) => {
    try {
        assertConfigured();
        const { name, email, password, phone, role } = req.body;

        if (!name || !email || !password) {
            return fail(res, "Name, email and password are required");
        }
        if (!PASSWORD_RULE.test(password)) {
            return fail(res, "Password must be at least 12 characters and include upper case, lower case, a number and a symbol");
        }

        // The very first admin needs the setup key from the server .env, after that only a signed in superadmin can add admins
        const adminCount = await Admin.countDocuments({ isDeleted: false });
        let requester: any = null;
        if (adminCount === 0) {
            const setupKey = process.env.ADMIN_SETUP_KEY;
            if (!setupKey || !safeEqual(String(req.headers['x-admin-setup-key'] || ''), setupKey)) {
                return fail(res, "Admin setup key is missing or invalid");
            }
        } else {
            requester = await controller.getTokenData(req.cookies?.[ADMIN_SESSION_COOKIE]);
            if (!requester || requester.role !== "superadmin") {
                return fail(res, "Only a signed in superadmin can register new admins");
            }
        }

        const existing = await Admin.findOne({ email: String(email).toLowerCase() });
        if (existing) {
            return fail(res, "Email already registered");
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const admin = await Admin.create({
            name,
            email,
            password: hashedPassword,
            phone,
            role: adminCount === 0 ? "superadmin" : (role === "superadmin" ? "superadmin" : "admin"),
        });

        // No session is issued here, the new admin must sign in with email OTP and Google Authenticator
        return res.status(200).json({
            status: true,
            message: "Admin registered successfully. Sign in to set up Google Authenticator.",
            data: { _id: admin._id, name: admin.name, email: admin.email, role: admin.role },
        });
    } catch (error) {
        console.log("Admin Register Error:", error);
        return res.status(500).json({ status: false, message: "Unable to register admin" });
    }
};

/* =========================
   LOGIN STEP 1: EMAIL + PASSWORD
========================= */
controller.login = async (req: any, res: any) => {
    try {
        assertConfigured();
        const email = String(req.body.email || '').toLowerCase().trim();
        const password = String(req.body.password || '');

        const admin: any = await Admin.findOne({ email, isDeleted: false }).select(`+password ${LOGIN_FIELDS}`);

        if (!admin) {
            await bcrypt.compare(password, DUMMY_HASH);
            return fail(res, "Invalid credentials");
        }

        if (isLocked(admin)) {
            return fail(res, lockedMessage(admin));
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            const locked = await registerFailure(admin);
            return fail(res, locked ? "Too many failed attempts. Account locked for 15 minutes." : "Invalid credentials");
        }

        // Start a fresh login challenge and send the email code
        const nonce = randomId();
        const otp = generateOtp();

        await Admin.updateOne({ _id: admin._id }, {
            loginNonce: nonce,
            loginStage: "otp",
            loginExpiry: new Date(Date.now() + LOGIN_TTL_MS),
            otpHash: hashOtp(admin._id.toString(), nonce, otp),
            otpExpiry: new Date(Date.now() + OTP_TTL_MS),
            otpAttempts: 0,
        });

        await sendOtpEmail(admin.email, otp);

        res.cookie(ADMIN_LOGIN_COOKIE, signLoginToken(admin._id.toString(), nonce), cookieOptions(LOGIN_TTL_MS));

        return res.status(200).json({
            status: true,
            message: "Verification code sent to your email",
            data: { next: "otp", email: maskEmail(admin.email) },
        });
    } catch (error) {
        console.log("Admin Login Error:", error);
        return res.status(500).json({ status: false, message: "Unable to sign in right now" });
    }
};

/* =========================
   LOGIN STEP 2: EMAIL OTP
========================= */
controller.verifyOtp = async (req: any, res: any) => {
    try {
        const otp = String(req.body.otp || '').trim();
        const admin: any = await getLoginChallenge(req, '+otpHash +otpExpiry +otpAttempts');

        if (!admin || admin.loginStage !== "otp") {
            clearLoginChallenge(res);
            return fail(res, "Login session expired. Please sign in again.", { restart: true });
        }
        if (isLocked(admin)) {
            clearLoginChallenge(res);
            return fail(res, lockedMessage(admin), { restart: true });
        }
        if (!admin.otpExpiry || admin.otpExpiry.getTime() < Date.now()) {
            clearLoginChallenge(res);
            return fail(res, "Verification code expired. Please sign in again.", { restart: true });
        }

        const valid = /^\d{6}$/.test(otp) && safeEqual(admin.otpHash, hashOtp(admin._id.toString(), admin.loginNonce, otp));

        if (!valid) {
            const attempts = (admin.otpAttempts || 0) + 1;
            if (attempts >= MAX_OTP_ATTEMPTS) {
                await Admin.updateOne({ _id: admin._id }, { $unset: { loginNonce: 1, loginStage: 1, loginExpiry: 1, otpHash: 1, otpExpiry: 1 } });
                await registerFailure(admin);
                clearLoginChallenge(res);
                return fail(res, "Too many wrong codes. Please sign in again.", { restart: true });
            }
            await Admin.updateOne({ _id: admin._id }, { otpAttempts: attempts });
            return fail(res, `Invalid code. ${MAX_OTP_ATTEMPTS - attempts} attempt(s) left.`);
        }

        const next = admin.totpEnabled ? "totp" : "totp_setup";
        await Admin.updateOne({ _id: admin._id }, { loginStage: next, $unset: { otpHash: 1, otpExpiry: 1 }, otpAttempts: 0 });

        return res.status(200).json({ status: true, message: "Email verified", data: { next } });
    } catch (error) {
        console.log("Admin OTP Error:", error);
        return res.status(500).json({ status: false, message: "Unable to verify code" });
    }
};

/* =========================
   LOGIN STEP 3a: GOOGLE AUTHENTICATOR SETUP (first sign in only)
========================= */
controller.totpSetup = async (req: any, res: any) => {
    try {
        const admin: any = await getLoginChallenge(req, '+totpPendingSecret');

        if (!admin || admin.loginStage !== "totp_setup" || admin.totpEnabled) {
            clearLoginChallenge(res);
            return fail(res, "Login session expired. Please sign in again.", { restart: true });
        }

        // Reuse the pending secret so refreshing the page does not invalidate an already scanned QR code
        let secret = admin.totpPendingSecret ? decrypt(admin.totpPendingSecret) : null;
        if (!secret) {
            secret = generateSecret();
            await Admin.updateOne({ _id: admin._id }, { totpPendingSecret: encrypt(secret) });
        }

        const uri = generateURI({ issuer: issuerName, label: admin.email, secret });
        const qrCode = await QRCode.toDataURL(uri, { margin: 1, width: 240 });

        return res.status(200).json({
            status: true,
            data: { qrCode, manualKey: secret.match(/.{1,4}/g).join(' ') },
        });
    } catch (error) {
        console.log("Admin TOTP Setup Error:", error);
        return res.status(500).json({ status: false, message: "Unable to set up authenticator" });
    }
};

/* =========================
   LOGIN STEP 3b: GOOGLE AUTHENTICATOR CODE
========================= */
controller.verifyTotp = async (req: any, res: any) => {
    try {
        const code = String(req.body.code || '').replace(/\s/g, '');
        const admin: any = await getLoginChallenge(req, '+totpSecret +totpPendingSecret +totpLastTimeStep');

        if (!admin || (admin.loginStage !== "totp" && admin.loginStage !== "totp_setup")) {
            clearLoginChallenge(res);
            return fail(res, "Login session expired. Please sign in again.", { restart: true });
        }
        if (isLocked(admin)) {
            clearLoginChallenge(res);
            return fail(res, lockedMessage(admin), { restart: true });
        }

        const isSetup = admin.loginStage === "totp_setup";
        const encrypted = isSetup ? admin.totpPendingSecret : admin.totpSecret;
        if (!encrypted) {
            clearLoginChallenge(res);
            return fail(res, "Authenticator is not set up. Please sign in again.", { restart: true });
        }

        let result: any = { valid: false };
        if (/^\d{6}$/.test(code)) {
            try {
                result = await verifyTotp({
                    secret: decrypt(encrypted),
                    token: code,
                    epochTolerance: 30, // allow one 30 second step of clock drift
                    // A code that was already used (or an older one) is rejected
                    ...(admin.totpLastTimeStep !== undefined && admin.totpLastTimeStep !== null ? { afterTimeStep: admin.totpLastTimeStep } : {}),
                });
            } catch (error) {
                result = { valid: false };
            }
        }

        if (!result.valid) {
            const locked = await registerFailure(admin);
            if (locked) {
                clearLoginChallenge(res);
                return fail(res, "Too many failed attempts. Account locked for 15 minutes.", { restart: true });
            }
            return fail(res, "Invalid authenticator code");
        }

        // All factors passed: create a single active session, any older session is signed out
        const sessionId = randomId();
        const update: any = {
            sessionId: hashSessionId(sessionId),
            totpLastTimeStep: result.timeStep,
            failedLoginAttempts: 0,
            lastLoginAt: new Date(),
            lastLoginIp: req.ip,
            $unset: { loginNonce: 1, loginStage: 1, loginExpiry: 1, lockUntil: 1, totpPendingSecret: 1 },
        };
        if (isSetup) {
            update.totpSecret = encrypted;
            update.totpEnabled = true;
        }
        await Admin.updateOne({ _id: admin._id }, update);

        clearLoginChallenge(res);
        res.cookie(ADMIN_SESSION_COOKIE, signSessionToken(admin._id.toString(), admin.role, sessionId), cookieOptions(SESSION_TTL_MS));

        return res.status(200).json({
            status: true,
            message: "Login successful",
            data: { _id: admin._id, name: admin.name, email: admin.email, role: admin.role },
        });
    } catch (error) {
        console.log("Admin TOTP Verify Error:", error);
        return res.status(500).json({ status: false, message: "Unable to verify authenticator code" });
    }
};

/* =========================
   LOGOUT
========================= */
controller.logout = async (req: any, res: any) => {
    try {
        const decoded = req.cookies?.[ADMIN_SESSION_COOKIE] ? verifySessionToken(req.cookies[ADMIN_SESSION_COOKIE]) : null;
        if (decoded) {
            await Admin.updateOne({ _id: decoded.id }, { $unset: { sessionId: 1 } });
        }
    } catch (error) {
        console.log("Admin Logout Error:", error);
    }
    res.clearCookie(ADMIN_SESSION_COOKIE, clearCookieOptions());
    clearLoginChallenge(res);
    return res.status(200).json({ status: true, message: "Logged out" });
};

/* =========================
   CURRENT ADMIN
========================= */
controller.me = async (req: any, res: any) => {
    const admin = req.user;
    return res.status(200).json({
        status: true,
        data: { _id: admin._id, name: admin.name, email: admin.email, role: admin.role },
    });
};

/* =========================
   GET TOKEN DATA (for middleware)
========================= */
controller.getTokenData = async (token: string) => {
    try {
        if (!token) return null;
        const decoded = verifySessionToken(token);
        if (!decoded) return null;

        const admin: any = await Admin.findById(decoded.id).select('+sessionId');
        if (!admin || admin.isDeleted || !admin.totpEnabled) return null;
        if (!safeEqual(admin.sessionId, hashSessionId(decoded.sid))) return null;

        admin.sessionId = undefined;
        return admin;
    } catch (error) {
        return null;
    }
};

/* =========================
   GET PROFILE
========================= */
controller.getProfile = async (req: any, res: any) => {
    try {
        const admin = await Admin.findById(req.user._id);
        if (!admin) {
            return res.status(200).json({ status: false, message: "Admin not found" });
        }
        return res.status(200).json({ status: true, data: admin });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

/* =========================
   UPDATE PROFILE
========================= */
controller.updateProfile = async (req: any, res: any) => {
    try {
        const { name, phone } = req.body;
        const admin = await Admin.findByIdAndUpdate(
            req.user._id,
            { name, phone },
            { new: true }
        );
        return res.status(200).json({ status: true, message: "Profile updated", data: admin });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

export default controller;
