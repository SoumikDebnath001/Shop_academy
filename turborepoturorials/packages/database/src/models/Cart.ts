import { Schema, model } from 'mongoose';

/* =========================
   CART ITEM SUB-SCHEMA
========================= */
const cartItemSchema = new Schema(
    {
        product: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        quantity: { type: Number, required: true, min: 1, default: 1 },
        price: { type: Number, required: true, min: 0 },

        /* variant selection (optional) */
        variantId: { type: Schema.Types.ObjectId },
        size: { type: String },
        color: { type: String },
    },
    { _id: true }
);

/* =========================
   CART SCHEMA
========================= */
const cartSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },

        items: [cartItemSchema],

        totalPrice: { type: Number, default: 0, min: 0 },
    },
    { timestamps: true }
);

export const Cart = model("Cart", cartSchema);
