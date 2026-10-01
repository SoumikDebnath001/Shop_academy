import { Schema, model } from 'mongoose';

/* =========================
   CATEGORY SCHEMA
========================= */
const categorySchema = new Schema(
    {
        name: { type: String, required: true, trim: true },

        slug: { type: String, required: true, unique: true, lowercase: true },

        description: { type: String },

        imageUrl: { type: String },
        imagePublicId: { type: String },

        parentCategory: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            default: null,
        },

        sortOrder: { type: Number, default: 0 },

        isActive: { type: Boolean, default: true },
        isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

categorySchema.index({ isActive: 1, sortOrder: 1 });
categorySchema.index({ parentCategory: 1 });

export const Category = model("Category", categorySchema);
