import { Payment } from '@repo/database';
import { Order } from '@repo/database';

const controller: any = {};

/* =========================
   CREATE PAYMENT
========================= */
controller.createPayment = async (req: any, res: any) => {
    try {
        const {
            orderId, method, provider,
            transactionId, gatewayOrderId, gatewayPaymentId, gatewaySignature,
        } = req.body;

        const order = await Order.findOne({
            _id: orderId,
            user: req.user._id,
            isDeleted: false,
        });

        if (!order) {
            return res.status(200).json({ status: false, message: "Order not found" });
        }

        const payment = await Payment.create({
            user: req.user._id,
            order: orderId,
            amount: order.totalAmount,
            currency: "INR",
            status: "completed",
            method: method || "razorpay",
            provider: provider || "razorpay",
            transactionId,
            gatewayOrderId,
            gatewayPaymentId,
            gatewaySignature,
        });

        // Update order payment status
        await Order.findByIdAndUpdate(orderId, {
            payment: payment._id,
            paymentStatus: "paid",
            paymentMethod: method || "razorpay",
            status: "confirmed",
        });

        return res.status(200).json({
            status: true,
            message: "Payment recorded successfully",
            data: payment,
        });
    } catch (error) {
        console.log("Create Payment Error:", error);
        return res.status(500).json({ status: false, message: error.message });
    }
};

/* =========================
   GET PAYMENT BY ID
========================= */
controller.getPaymentById = async (req: any, res: any) => {
    try {
        const payment = await Payment.findOne({
            _id: req.params.id,
            user: req.user._id,
        })
            .populate("order", "orderNumber status totalAmount");

        if (!payment) {
            return res.status(200).json({ status: false, message: "Payment not found" });
        }

        return res.status(200).json({ status: true, data: payment });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

/* =========================
   GET MY PAYMENTS
========================= */
controller.getMyPayments = async (req: any, res: any) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const payments = await Payment.find({ user: req.user._id })
            .populate("order", "orderNumber status totalAmount")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Payment.countDocuments({ user: req.user._id });

        return res.status(200).json({
            status: true,
            data: payments,
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

export default controller;
