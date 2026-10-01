import { Schema, model } from 'mongoose';

/* =========================
   ADMIN SCHEMA
========================= */
const adminSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: { type: String, required: true, select: false },

        phone: { type: String },

        profileImage: { type: String },
        profileImagePublicId: { type: String },

        role: {
            type: String,
            enum: ["superadmin", "admin"],
            default: "admin",
        },

        token: { type: String, select: false },

        /* =========================
           LOGIN PROTECTION
        ========================= */
        failedLoginAttempts: { type: Number, default: 0, select: false },
        lockUntil: { type: Date, select: false },

        /* =========================
           LOGIN CHALLENGE (password -> email OTP -> authenticator)
        ========================= */
        loginNonce: { type: String, select: false },
        loginStage: { type: String, enum: ["otp", "totp", "totp_setup"], select: false },
        loginExpiry: { type: Date, select: false },

        otpHash: { type: String, select: false },
        otpExpiry: { type: Date, select: false },
        otpAttempts: { type: Number, default: 0, select: false },

        /* =========================
           GOOGLE AUTHENTICATOR (secrets are stored encrypted)
        ========================= */
        totpEnabled: { type: Boolean, default: false },
        totpSecret: { type: String, select: false },
        totpPendingSecret: { type: String, select: false },
        totpLastTimeStep: { type: Number, select: false },

        /* =========================
           SESSION (one active session per admin)
        ========================= */
        sessionId: { type: String, select: false },
        lastLoginAt: { type: Date },
        lastLoginIp: { type: String },

        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export const Admin = model("Admin", adminSchema);
