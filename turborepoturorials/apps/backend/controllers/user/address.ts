import { Address } from '@repo/database';

const controller: any = {};

/* =========================
   CREATE ADDRESS
========================= */
controller.create = async (req: any, res: any) => {
    try {
        const {
            fullName, phone, addressLine1, addressLine2,
            landmark, city, state, pincode, country, type, isDefault,
        } = req.body;

        // If setting as default, unset existing default
        if (isDefault) {
            await Address.updateMany(
                { user: req.user._id, isDeleted: false },
                { isDefault: false }
            );
        }

        const address = await Address.create({
            user: req.user._id,
            fullName,
            phone,
            addressLine1,
            addressLine2,
            landmark,
            city,
            state,
            pincode,
            country: country || "India",
            type: type || "home",
            isDefault: isDefault || false,
        });

        return res.status(200).json({
            status: true,
            message: "Address added successfully",
            data: address,
        });
    } catch (error) {
        console.log("Address Create Error:", error);
        return res.status(500).json({ status: false, message: error.message });
    }
};

/* =========================
   GET ALL ADDRESSES
========================= */
controller.getAll = async (req: any, res: any) => {
    try {
        const addresses = await Address.find({ user: req.user._id, isDeleted: false })
            .sort({ isDefault: -1, createdAt: -1 });

        return res.status(200).json({ status: true, data: addresses });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

/* =========================
   GET ADDRESS BY ID
========================= */
controller.getById = async (req: any, res: any) => {
    try {
        const address = await Address.findOne({
            _id: req.params.id,
            user: req.user._id,
            isDeleted: false,
        });

        if (!address) {
            return res.status(200).json({ status: false, message: "Address not found" });
        }

        return res.status(200).json({ status: true, data: address });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

/* =========================
   UPDATE ADDRESS
========================= */
controller.update = async (req: any, res: any) => {
    try {
        const address = await Address.findOne({
            _id: req.params.id,
            user: req.user._id,
            isDeleted: false,
        });

        if (!address) {
            return res.status(200).json({ status: false, message: "Address not found" });
        }

        const updateData: any = {};
        const fields = [
            "fullName", "phone", "addressLine1", "addressLine2",
            "landmark", "city", "state", "pincode", "country", "type",
        ];

        fields.forEach((field) => {
            if (req.body[field] !== undefined) updateData[field] = req.body[field];
        });

        if (req.body.isDefault) {
            await Address.updateMany(
                { user: req.user._id, isDeleted: false },
                { isDefault: false }
            );
            updateData.isDefault = true;
        }

        const updated = await Address.findByIdAndUpdate(req.params.id, updateData, { new: true });

        return res.status(200).json({
            status: true,
            message: "Address updated",
            data: updated,
        });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

/* =========================
   DELETE ADDRESS (soft delete)
========================= */
controller.delete = async (req: any, res: any) => {
    try {
        const address = await Address.findOne({
            _id: req.params.id,
            user: req.user._id,
            isDeleted: false,
        });

        if (!address) {
            return res.status(200).json({ status: false, message: "Address not found" });
        }

        await Address.findByIdAndUpdate(req.params.id, { isDeleted: true });

        return res.status(200).json({ status: true, message: "Address deleted" });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

/* =========================
   SET DEFAULT ADDRESS
========================= */
controller.setDefault = async (req: any, res: any) => {
    try {
        await Address.updateMany(
            { user: req.user._id, isDeleted: false },
            { isDefault: false }
        );

        const address = await Address.findByIdAndUpdate(
            req.params.id,
            { isDefault: true },
            { new: true }
        );

        if (!address) {
            return res.status(200).json({ status: false, message: "Address not found" });
        }

        return res.status(200).json({
            status: true,
            message: "Default address set",
            data: address,
        });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

export default controller;
