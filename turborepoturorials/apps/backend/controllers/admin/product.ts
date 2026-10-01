import { Product } from '@repo/database';
import { doUpload, doUploadMultiple, doDelete } from '../../service/cloudinary';

const controller: any = {};

/* =========================
   CREATE PRODUCT
========================= */
controller.create = async (req: any, res: any) => {
    try {
        const {
            name, slug, description, shortDescription,
            price, salePrice, sku, stock,
            category, brand, tags, variants,
            isFeatured, type,
        } = req.body;

        const existing = await Product.findOne({ slug, isDeleted: false });
        if (existing) {
            return res.status(200).json({ status: false, message: "Product slug already exists" });
        }

        let images = [];

        if (req.files && req.files.length > 0) {
            const uploadResults = await doUploadMultiple(req, "products");
            images = uploadResults
                .filter((r) => r.status)
                .map((r) => ({
                    imageUrl: r.url,
                    imagePublicId: r.publicId,
                }));
        }

        const product = await Product.create({
            name,
            slug,
            description,
            shortDescription,
            price,
            salePrice,
            sku,
            stock: stock || 0,
            images,
            category,
            brand,
            type: type || 'Craft',
            tags: tags ? (typeof tags === "string" ? JSON.parse(tags) : tags) : [],
            variants: variants ? (typeof variants === "string" ? JSON.parse(variants) : variants) : [],
            isFeatured: isFeatured === "true" || isFeatured === true,
        });

        return res.status(200).json({
            status: true,
            message: "Product created successfully",
            data: product,
        });
    } catch (error) {
        console.log("Product Create Error:", error);
        return res.status(500).json({ status: false, message: error.message });
    }
};

/* =========================
   GET ALL PRODUCTS
========================= */
controller.getAll = async (req: any, res: any) => {
    try {
        const { page = 1, limit = 20, category, search, isFeatured, type } = req.query;

        const filter: any = { isDeleted: false };
        if (category) filter.category = category;
        if (type) filter.type = type;
        if (isFeatured) filter.isFeatured = isFeatured === "true";
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { tags: { $regex: search, $options: "i" } },
            ];
        }

        const products = await Product.find(filter)
            .populate("category", "name slug")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Product.countDocuments(filter);

        return res.status(200).json({
            status: true,
            data: products,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

/* =========================
   GET PRODUCT BY ID
========================= */
controller.getById = async (req: any, res: any) => {
    try {
        const product = await Product.findOne({ _id: req.params.id, isDeleted: false })
            .populate("category", "name slug");

        if (!product) {
            return res.status(200).json({ status: false, message: "Product not found" });
        }

        return res.status(200).json({ status: true, data: product });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

/* =========================
   UPDATE PRODUCT
========================= */
controller.update = async (req: any, res: any) => {
    try {
        const product = await Product.findOne({ _id: req.params.id, isDeleted: false });
        if (!product) {
            return res.status(200).json({ status: false, message: "Product not found" });
        }

        const {
            name, slug, description, shortDescription,
            price, salePrice, sku, stock,
            category, brand, tags, variants,
            isFeatured, isActive, removeImages, type,
        } = req.body;

        // Remove specified images
        if (removeImages) {
            const toRemove = typeof removeImages === "string" ? JSON.parse(removeImages) : removeImages;
            for (const publicId of toRemove) {
                await doDelete(publicId);
                product.images = product.images.filter((img) => img.imagePublicId !== publicId) as any;
            }
        }

        // Upload new images
        if (req.files && req.files.length > 0) {
            const uploadResults = await doUploadMultiple(req, "products");
            const newImages = uploadResults
                .filter((r) => r.status)
                .map((r) => ({
                    imageUrl: r.url,
                    imagePublicId: r.publicId,
                }));
            product.images = [...product.images, ...newImages] as any;
        }

        const updated = await Product.findByIdAndUpdate(
            req.params.id,
            {
                name: name || product.name,
                slug: slug || product.slug,
                description: description || product.description,
                shortDescription: shortDescription !== undefined ? shortDescription : product.shortDescription,
                price: price !== undefined ? price : product.price,
                salePrice: salePrice !== undefined ? salePrice : product.salePrice,
                sku: sku !== undefined ? sku : product.sku,
                stock: stock !== undefined ? stock : product.stock,
                images: product.images,
                category: category || product.category,
                brand: brand !== undefined ? brand : product.brand,
                type: type || product.type,
                tags: tags ? (typeof tags === "string" ? JSON.parse(tags) : tags) : product.tags,
                variants: variants ? (typeof variants === "string" ? JSON.parse(variants) : variants) : product.variants,
                isFeatured: isFeatured !== undefined ? (isFeatured === "true" || isFeatured === true) : product.isFeatured,
                isActive: isActive !== undefined ? (isActive === "true" || isActive === true) : product.isActive,
            },
            { new: true }
        );

        return res.status(200).json({
            status: true,
            message: "Product updated successfully",
            data: updated,
        });
    } catch (error) {
        console.log("Product Update Error:", error);
        return res.status(500).json({ status: false, message: error.message });
    }
};

/* =========================
   DELETE PRODUCT (soft delete)
========================= */
controller.delete = async (req: any, res: any) => {
    try {
        const product = await Product.findOne({ _id: req.params.id, isDeleted: false });
        if (!product) {
            return res.status(200).json({ status: false, message: "Product not found" });
        }

        // Delete all images from Cloudinary
        for (const img of product.images) {
            if (img.imagePublicId) {
                await doDelete(img.imagePublicId);
            }
        }

        await Product.findByIdAndUpdate(req.params.id, { isDeleted: true });

        return res.status(200).json({ status: true, message: "Product deleted successfully" });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

export default controller;
