import { Schema, model } from 'mongoose';

/**
 * Payment record for order transactions.
 * `amount` / `currency` are ALWAYS computed server-side — never accepted
 * from the client.
 */

/* =========================
   PAYMENT SCHEMA
========================= */
const paymentSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        order: {
            type: Schema.Types.ObjectId,
            ref: "Order",
            required: true,
            index: true,
        },

        /* =========================
           AMOUNT
        ========================= */
        amount: { type: Number, required: true, min: 0 },
        currency: { type: String, required: true, default: "INR", uppercase: true },

        /* =========================
           PAYMENT STATUS
        ========================= */
        status: {
            type: String,
            enum: ["pending", "completed", "failed", "refunded"],
            default: "pending",
            index: true,
        },

        method: {
            type: String,
            enum: ["cod", "upi", "card", "netbanking", "wallet", "razorpay", "stripe"],
            default: "cod",
        },

        provider: { type: String, default: "razorpay" },

        /* =========================
           GATEWAY REFERENCES
        ========================= */
        transactionId: { type: String, index: true },
        gatewayOrderId: { type: String, index: true },
        gatewayPaymentId: { type: String },
        gatewaySignature: { type: String },

        paymentStatusDescription: { type: String },

        /* =========================
           META
        ========================= */
        meta: { type: Schema.Types.Mixed },
        fulfilledAt: { type: Date },
    },
    { timestamps: true }
);

export const Payment = model("Payment", paymentSchema);
