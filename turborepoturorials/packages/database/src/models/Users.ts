import { Schema, model } from 'mongoose';

/* =========================
   USER SCHEMA
========================= */
const userSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        phone: { type: String },

        /* Google login users have no password */
        password: { type: String, select: false },

        googleId: { type: String, unique: true, sparse: true },

        profileImage: { type: String },
        profileImagePublicId: { type: String },

        gender: {
            type: String,
            enum: ["male", "female", "other", "Not Specified"],
        },

        dob: { type: Date },

        /* =========================
           OTP FIELDS
        ========================= */
        otpCode: { type: String, select: false },
        otpExpiry: { type: Date, select: false },
        otpVerified: { type: Boolean, select: false },

        /* =========================
           AUTH
        ========================= */
        token: { type: String, select: false },

        /* =========================
           WISHLIST
        ========================= */
        wishlist: [{ type: Schema.Types.ObjectId, ref: "Product" }],

        /* =========================
           STATUS
        ========================= */
        isActive: { type: Boolean, default: true },
        isBlocked: { type: Boolean, default: false },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

export const User = model("User", userSchema);
