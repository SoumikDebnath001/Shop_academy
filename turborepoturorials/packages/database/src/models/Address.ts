import { Schema, model } from 'mongoose';

/* =========================
   ADDRESS SCHEMA
========================= */
const addressSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        fullName: { type: String, required: true, trim: true },

        phone: { type: String, required: true },

        addressLine1: { type: String, required: true },

        addressLine2: { type: String },

        landmark: { type: String },

        city: { type: String, required: true },

        state: { type: String, required: true },

        pincode: { type: String, required: true },

        country: { type: String, required: true, default: "India" },

        type: {
            type: String,
            enum: ["home", "work", "other"],
            default: "home",
        },

        isDefault: { type: Boolean, default: false },

        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

addressSchema.index({ user: 1, isDefault: 1 });

export const Address = model("Address", addressSchema);
