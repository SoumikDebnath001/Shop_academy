import { Schema, model } from 'mongoose';

/* =========================
   PRODUCT IMAGE SUB-SCHEMA
========================= */
const productImageSchema = new Schema(
    {
        imageUrl: { type: String, required: true },
        imagePublicId: { type: String, required: true },
    },
    { _id: false }
);

/* =========================
   PRODUCT VARIANT SUB-SCHEMA
========================= */
const variantSchema = new Schema(
    {
        size: { type: String },
        color: { type: String },
        price: { type: Number },
        stock: { type: Number, default: 0 },
        sku: { type: String },
    },
    { _id: true }
);

/* =========================
   PRODUCT SCHEMA
========================= */
const productSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },

        slug: { type: String, required: true, unique: true, lowercase: true },

        description: { type: String, required: true },

        shortDescription: { type: String },

        /* =========================
           PRICING
        ========================= */
        price: { type: Number, required: true, min: 0 },
        salePrice: { type: Number, min: 0 },

        sku: { type: String, unique: true, sparse: true },

        stock: { type: Number, default: 0, min: 0 },

        /* =========================
           IMAGES (Cloudinary)
        ========================= */
        images: [productImageSchema],

        /* =========================
           CATEGORY & BRAND
        ========================= */
        category: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            required: true,
        },

        brand: { type: String },

        type: {
            type: String,
            enum: ['Gift', 'Craft'],
            default: 'Craft'
        },

        tags: [{ type: String }],

        /* =========================
           VARIANTS
        ========================= */
        variants: [variantSchema],

        /* =========================
           RATINGS
        ========================= */
        ratingsAverage: { type: Number, default: 0, min: 0, max: 5 },
        ratingsCount: { type: Number, default: 0 },

        /* =========================
           FLAGS
        ========================= */
        isFeatured: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ price: 1 });
productSchema.index({ name: "text", tags: "text" });

export const Product = model("Product", productSchema);
