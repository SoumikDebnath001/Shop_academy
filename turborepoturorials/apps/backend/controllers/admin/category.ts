import { Category } from '@repo/database';
import { doUpload, doDelete } from '../../service/cloudinary';

const controller: any = {};

/* =========================
   CREATE CATEGORY
========================= */
controller.create = async (req: any, res: any) => {
    try {
        const { name, slug, description, parentCategory, sortOrder } = req.body;

        const existing = await Category.findOne({ slug, isDeleted: false });
        if (existing) {
            return res.status(200).json({ status: false, message: "Category slug already exists" });
        }

        let imageUrl = null;
        let imagePublicId = null;

        if (req.file) {
            const uploadResult = await doUpload(req, "categories");
            if (uploadResult.status) {
                imageUrl = uploadResult.url;
                imagePublicId = uploadResult.publicId;
            }
        }

        const category = await Category.create({
            name,
            slug,
            description,
            imageUrl,
            imagePublicId,
            parentCategory: parentCategory || null,
            sortOrder: sortOrder || 0,
        });

        return res.status(200).json({
            status: true,
            message: "Category created successfully",
            data: category,
        });
    } catch (error) {
        console.log("Category Create Error:", error);
        return res.status(500).json({ status: false, message: error.message });
    }
};

/* =========================
   GET ALL CATEGORIES
========================= */
controller.getAll = async (req: any, res: any) => {
    try {
        const categories = await Category.find({ isDeleted: false })
            .populate("parentCategory", "name slug")
            .sort({ sortOrder: 1, createdAt: -1 });

        return res.status(200).json({ status: true, data: categories });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

/* =========================
   GET CATEGORY BY ID
========================= */
controller.getById = async (req: any, res: any) => {
    try {
        const category = await Category.findOne({ _id: req.params.id, isDeleted: false })
            .populate("parentCategory", "name slug");

        if (!category) {
            return res.status(200).json({ status: false, message: "Category not found" });
        }

        return res.status(200).json({ status: true, data: category });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

/* =========================
   UPDATE CATEGORY
========================= */
controller.update = async (req: any, res: any) => {
    try {
        const { name, slug, description, parentCategory, sortOrder, isActive } = req.body;

        const category = await Category.findOne({ _id: req.params.id, isDeleted: false });
        if (!category) {
            return res.status(200).json({ status: false, message: "Category not found" });
        }

        let imageUrl = category.imageUrl;
        let imagePublicId = category.imagePublicId;

        if (req.file) {
            // Delete old image from Cloudinary
            if (category.imagePublicId) {
                await doDelete(category.imagePublicId);
            }
            const uploadResult = await doUpload(req, "categories");
            if (uploadResult.status) {
                imageUrl = uploadResult.url;
                imagePublicId = uploadResult.publicId;
            }
        }

        const updated = await Category.findByIdAndUpdate(
            req.params.id,
            {
                name: name || category.name,
                slug: slug || category.slug,
                description: description !== undefined ? description : category.description,
                imageUrl,
                imagePublicId,
                parentCategory: parentCategory !== undefined ? parentCategory : category.parentCategory,
                sortOrder: sortOrder !== undefined ? sortOrder : category.sortOrder,
                isActive: isActive !== undefined ? isActive : category.isActive,
            },
            { new: true }
        );

        return res.status(200).json({
            status: true,
            message: "Category updated successfully",
            data: updated,
        });
    } catch (error) {
        console.log("Category Update Error:", error);
        return res.status(500).json({ status: false, message: error.message });
    }
};

/* =========================
   DELETE CATEGORY (soft delete)
========================= */
controller.delete = async (req: any, res: any) => {
    try {
        const category = await Category.findOne({ _id: req.params.id, isDeleted: false });
        if (!category) {
            return res.status(200).json({ status: false, message: "Category not found" });
        }

        // Delete image from Cloudinary
        if (category.imagePublicId) {
            await doDelete(category.imagePublicId);
        }

        await Category.findByIdAndUpdate(req.params.id, { isDeleted: true });

        return res.status(200).json({ status: true, message: "Category deleted successfully" });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

export default controller;
