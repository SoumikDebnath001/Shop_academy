import { Order } from '@repo/database';
import { Cart } from '@repo/database';
import { Address } from '@repo/database';
import { Product } from '@repo/database';
import { v4 as uuidv4 } from 'uuid';

const controller: any = {};

/* =========================
   PLACE ORDER
========================= */
controller.placeOrder = async (req: any, res: any) => {
    try {
        const { addressId, paymentMethod = "cod", notes } = req.body;
        const userId = req.user._id;

        // 1. Get cart
        const cart = await Cart.findOne({ user: userId }).populate("items.product", "name slug images price salePrice stock");
        if (!cart || cart.items.length === 0) {
            return res.status(200).json({ status: false, message: "Cart is empty" });
        }

        // 2. Get shipping address
        const address = await Address.findOne({ _id: addressId, user: userId, isDeleted: false });
        if (!address) {
            return res.status(200).json({ status: false, message: "Address not found" });
        }

        // 3. Build order items + check stock
        const orderItems = [];
        for (const cartItem of cart.items) {
            const product = await Product.findById(cartItem.product._id || cartItem.product);
            if (!product || product.isDeleted || !product.isActive) {
                return res.status(200).json({
                    status: false,
                    message: `Product "${(cartItem.product as any).name || 'unknown'}" is no longer available`,
                });
            }
            if (product.stock < cartItem.quantity) {
                return res.status(200).json({
                    status: false,
                    message: `Insufficient stock for "${product.name}". Available: ${product.stock}`,
                });
            }

            orderItems.push({
                product: product._id,
                name: product.name,
                quantity: cartItem.quantity,
                price: cartItem.price,
                imageUrl: product.images.length > 0 ? product.images[0].imageUrl : null,
                variantId: cartItem.variantId,
                size: cartItem.size,
                color: cartItem.color,
            });

            // Reduce stock
            product.stock -= cartItem.quantity;
            await product.save();
        }

        // 4. Calculate totals
        const itemsTotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const shippingCharge = itemsTotal >= 500 ? 0 : 50; // Free shipping over 500
        const totalAmount = itemsTotal + shippingCharge;

        // 5. Generate order number
        const orderNumber = "MAMI-" + Date.now().toString(36).toUpperCase() + "-" + uuidv4().slice(0, 4).toUpperCase();

        // 6. Create order
        const order = await Order.create({
            orderNumber,
            user: userId,
            items: orderItems,
            shippingAddress: {
                fullName: address.fullName,
                phone: address.phone,
                addressLine1: address.addressLine1,
                addressLine2: address.addressLine2,
                landmark: address.landmark,
                city: address.city,
                state: address.state,
                pincode: address.pincode,
                country: address.country,
            },
            itemsTotal,
            shippingCharge,
            totalAmount,
            paymentMethod,
            paymentStatus: paymentMethod === "cod" ? "pending" : "pending",
            status: "pending",
            notes,
        });

        // 7. Clear cart
        await Cart.findOneAndUpdate({ user: userId }, { items: [], totalPrice: 0 });

        return res.status(200).json({
            status: true,
            message: "Order placed successfully",
            data: order,
        });
    } catch (error) {
        console.log("Place Order Error:", error);
        return res.status(500).json({ status: false, message: error.message });
    }
};

/* =========================
   GET MY ORDERS
========================= */
controller.getMyOrders = async (req: any, res: any) => {
    try {
        const { page = 1, limit = 10, status } = req.query;

        const filter: any = { user: req.user._id, isDeleted: false };
        if (status) filter.status = status;

        const orders = await Order.find(filter)
            .populate("items.product", "name slug images")
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
   GET ORDER BY ID
========================= */
controller.getOrderById = async (req: any, res: any) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user._id,
            isDeleted: false,
        })
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
   CANCEL ORDER
========================= */
controller.cancelOrder = async (req: any, res: any) => {
    try {
        const { reason } = req.body;

        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user._id,
            isDeleted: false,
        });

        if (!order) {
            return res.status(200).json({ status: false, message: "Order not found" });
        }

        if (!["pending", "confirmed"].includes(order.status)) {
            return res.status(200).json({
                status: false,
                message: "Order cannot be cancelled at this stage",
            });
        }

        // Restore stock
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: item.quantity },
            });
        }

        order.status = "cancelled";
        order.cancelledAt = new Date();
        order.cancellationReason = reason || "Cancelled by user";
        await order.save();

        return res.status(200).json({
            status: true,
            message: "Order cancelled successfully",
            data: order,
        });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

export default controller;
