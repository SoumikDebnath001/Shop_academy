import { Schema, model } from 'mongoose';

/* =========================
   ORDER ITEM SUB-SCHEMA
========================= */
const orderItemSchema = new Schema(
    {
        product: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
        imageUrl: { type: String },

        /* variant snapshot */
        variantId: { type: Schema.Types.ObjectId },
        size: { type: String },
        color: { type: String },
    },
    { _id: true }
);

/* =========================
   SHIPPING ADDRESS SNAPSHOT
========================= */
const shippingAddressSchema = new Schema(
    {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        addressLine1: { type: String, required: true },
        addressLine2: { type: String },
        landmark: { type: String },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
        country: { type: String, default: "India" },
    },
    { _id: false }
);

/* =========================
   ORDER SCHEMA
========================= */
const orderSchema = new Schema(
    {
        orderNumber: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        items: [orderItemSchema],

        shippingAddress: shippingAddressSchema,

        /* =========================
           PRICING
        ========================= */
        itemsTotal: { type: Number, required: true, min: 0 },
        shippingCharge: { type: Number, default: 0, min: 0 },
        discount: { type: Number, default: 0, min: 0 },
        totalAmount: { type: Number, required: true, min: 0 },

        /* =========================
           PAYMENT
        ========================= */
        payment: {
            type: Schema.Types.ObjectId,
            ref: "Payment",
        },

        paymentMethod: {
            type: String,
            enum: ["cod", "upi", "card", "netbanking", "wallet", "razorpay", "stripe"],
            default: "cod",
        },

        paymentStatus: {
            type: String,
            enum: ["pending", "paid", "failed", "refunded"],
            default: "pending",
        },

        /* =========================
           ORDER STATUS
        ========================= */
        status: {
            type: String,
            enum: [
                "pending",
                "confirmed",
                "processing",
                "shipped",
                "out_for_delivery",
                "delivered",
                "cancelled",
                "returned",
            ],
            default: "pending",
            index: true,
        },

        /* =========================
           TRACKING
        ========================= */
        trackingNumber: { type: String },
        trackingUrl: { type: String },
        courierName: { type: String },

        estimatedDelivery: { type: Date },
        deliveredAt: { type: Date },
        cancelledAt: { type: Date },

        cancellationReason: { type: String },

        notes: { type: String },

        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

orderSchema.index({ status: 1, createdAt: -1 });

export const Order = model("Order", orderSchema);
