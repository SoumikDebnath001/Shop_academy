import { Order } from '@repo/database';

const controller: any = {};

/* =========================
   GET ALL ORDERS (Admin)
========================= */
controller.getAll = async (req: any, res: any) => {
    try {
        const { page = 1, limit = 20, status, search } = req.query;

        const filter: any = { isDeleted: false };
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { orderNumber: { $regex: search, $options: "i" } },
            ];
        }

        const orders = await Order.find(filter)
            .populate("user", "name email phone")
            .populate("items.product", "name slug images")
            .populate("payment")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Order.countDocuments(filter);

        return res.status(200).json({
            status: true,
            data: orders,
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
   GET ORDER BY ID (Admin)
========================= */
controller.getById = async (req: any, res: any) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, isDeleted: false })
            .populate("user", "name email phone")
            .populate("items.product", "name slug images price")
            .populate("payment");

        if (!order) {
            return res.status(200).json({ status: false, message: "Order not found" });
        }

        return res.status(200).json({ status: true, data: order });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

/* =========================
   UPDATE ORDER STATUS (Admin)
========================= */
controller.updateStatus = async (req: any, res: any) => {
    try {
        const { status, trackingNumber, trackingUrl, courierName, estimatedDelivery, notes } = req.body;

        const order = await Order.findOne({ _id: req.params.id, isDeleted: false });
        if (!order) {
            return res.status(200).json({ status: false, message: "Order not found" });
        }

        const updateData: any = {};
        if (status) updateData.status = status;
        if (trackingNumber) updateData.trackingNumber = trackingNumber;
        if (trackingUrl) updateData.trackingUrl = trackingUrl;
        if (courierName) updateData.courierName = courierName;
        if (estimatedDelivery) updateData.estimatedDelivery = estimatedDelivery;
        if (notes) updateData.notes = notes;

        if (status === "delivered") updateData.deliveredAt = new Date();
        if (status === "cancelled") updateData.cancelledAt = new Date();

        const updated = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true })
            .populate("user", "name email phone")
            .populate("payment");

        return res.status(200).json({
            status: true,
            message: "Order status updated",
            data: updated,
        });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

export default controller;
