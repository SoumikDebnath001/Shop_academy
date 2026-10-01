import nodemailer from 'nodemailer';
import { connectDB } from '@repo/database';
import { cloudinary } from './cloudinary';
import { assertConfigured } from './adminSecurity';
import 'colors';

/* =========================
   STARTUP STATUS
   Checks every outside service the backend depends on and prints one report,
   so it is easy to see which one is not working.
========================= */

type Status = 'ok' | 'warn' | 'fail';
type CheckResult = { name: string; status: Status; message: string };

const CHECK_TIMEOUT_MS = 20000;

// Stops a check that hangs (wrong host, blocked port) from holding up the report
const withTimeout = <T>(promise: Promise<T>, ms = CHECK_TIMEOUT_MS): Promise<T> =>
    Promise.race([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`timed out after ${ms / 1000}s`)), ms)),
    ]);

const missingEnv = (...keys: string[]) => keys.filter((key) => !process.env[key]);

const errorMessage = (error: any) => error?.error?.message || error?.message || String(error);

/* MongoDB: opens the shared connection */
const checkMongo = async (): Promise<CheckResult> => {
    const name = 'MongoDB';
    try {
        const instance = await withTimeout(connectDB());
        const { host, port, name: dbName } = instance.connection;
        return { name, status: 'ok', message: `connected to ${host}:${port}/${dbName}` };
    } catch (error) {
        return { name, status: 'fail', message: errorMessage(error) };
    }
};

/* Cloudinary: pings the API with the configured credentials */
const checkCloudinary = async (): Promise<CheckResult> => {
    const name = 'Cloudinary';
    const missing = missingEnv('CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET');
    if (missing.length) return { name, status: 'fail', message: `missing ${missing.join(', ')}` };

    try {
        await withTimeout(cloudinary.api.ping());
        return { name, status: 'ok', message: `connected to cloud "${process.env.CLOUDINARY_CLOUD_NAME}"` };
    } catch (error) {
        return { name, status: 'fail', message: errorMessage(error) };
    }
};

/* Google OAuth: exchanges a fake code. Google answers "invalid_grant" when the
   client id and secret are right, and "invalid_client" when they are wrong. */
const checkGoogle = async (): Promise<CheckResult> => {
    const name = 'Google OAuth';
    const missing = missingEnv('GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_CALLBACK_URL');
    if (missing.length) return { name, status: 'fail', message: `missing ${missing.join(', ')}` };

    try {
        const response = await withTimeout(fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: 'startup-status-check',
                client_id: process.env.GOOGLE_CLIENT_ID as string,
                client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
                redirect_uri: process.env.GOOGLE_CALLBACK_URL as string,
            }),
        }));
        const body: any = await response.json().catch(() => ({}));

        if (body.error === 'invalid_grant') {
            return { name, status: 'ok', message: `credentials valid, callback ${process.env.GOOGLE_CALLBACK_URL}` };
        }
        if (body.error === 'invalid_client' || body.error === 'unauthorized_client') {
            return { name, status: 'fail', message: `client id or secret rejected (${body.error_description || body.error})` };
        }
        return { name, status: 'warn', message: `unexpected answer from Google: ${body.error || response.status}` };
    } catch (error) {
        return { name, status: 'fail', message: `could not reach Google: ${errorMessage(error)}` };
    }
};

/* Mail (admin login codes): verifies the SMTP login */
const checkMail = async (): Promise<CheckResult> => {
    const name = 'Mail (SMTP)';
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
        const missing = missingEnv('SMTP_HOST', 'SMTP_USER', 'SMTP_PASS').join(', ');
        return process.env.NODE_ENV === 'production'
            ? { name, status: 'fail', message: `not configured (missing ${missing}), admin login will fail` }
            : { name, status: 'warn', message: `not configured (missing ${missing}), admin login codes are printed in this console` };
    }

    try {
        const transporter = nodemailer.createTransport({
            host: SMTP_HOST,
            port: Number(SMTP_PORT) || 587,
            secure: Number(SMTP_PORT) === 465,
            auth: { user: SMTP_USER, pass: SMTP_PASS },
        });
        await withTimeout(transporter.verify());
        return { name, status: 'ok', message: `logged in to ${SMTP_HOST}:${Number(SMTP_PORT) || 587} as ${SMTP_USER}` };
    } catch (error) {
        return { name, status: 'fail', message: errorMessage(error) };
    }
};

/* Admin security secrets (JWT secret and 2FA encryption key) */
const checkAdminSecurity = async (): Promise<CheckResult> => {
    const name = 'Admin security';
    try {
        assertConfigured();
        return { name, status: 'ok', message: 'ADMIN_JWT_SECRET and ADMIN_2FA_ENCRYPTION_KEY set' };
    } catch (error) {
        return { name, status: 'fail', message: errorMessage(error) };
    }
};

const ICONS: Record<Status, string> = { ok: '✅', warn: '⚠️ ', fail: '❌' };

const colorize = (status: Status, text: string) =>
    status === 'ok' ? text.green : status === 'warn' ? text.yellow : text.red;

/* Runs every check and prints the report. Call it once the server is listening. */
export const printStartupStatus = async (port: number | string) => {
    const results: CheckResult[] = [
        { name: 'Server', status: 'ok', message: `running on http://localhost:${port}` },
        ...await Promise.all([checkMongo(), checkCloudinary(), checkGoogle(), checkMail(), checkAdminSecurity()]),
    ];

    const width = Math.max(...results.map((result) => result.name.length));
    const failed = results.filter((result) => result.status === 'fail').length;
    const warned = results.filter((result) => result.status === 'warn').length;

    console.log('\n==================== SERVICE STATUS ===================='.cyan.bold);
    for (const result of results) {
        console.log(`${ICONS[result.status]} ${colorize(result.status, result.name.padEnd(width))}  ${result.message}`);
    }
    const summary = failed
        ? `${failed} service(s) NOT working${warned ? `, ${warned} warning(s)` : ''}`.red.bold
        : warned ? `All services working, ${warned} warning(s)`.yellow.bold : 'All services working'.green.bold;
    console.log(summary);
    console.log('========================================================\n'.cyan.bold);
};
