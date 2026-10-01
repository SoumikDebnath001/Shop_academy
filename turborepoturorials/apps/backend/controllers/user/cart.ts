import { Cart } from '@repo/database';
import { Product } from '@repo/database';

const controller: any = {};

/* =========================
   ADD TO CART
========================= */
controller.addToCart = async (req: any, res: any) => {
    try {
        const { productId, quantity = 1, variantId, size, color } = req.body;
        const userId = req.user._id;

        const product = await Product.findOne({ _id: productId, isDeleted: false, isActive: true });
        if (!product) {
            return res.status(200).json({ status: false, message: "Product not found" });
        }

        let price = product.salePrice || product.price;

        // If variant is selected, use variant price
        if (variantId && product.variants.length > 0) {
            const variant = product.variants.id(variantId);
            if (variant && variant.price) {
                price = variant.price;
            }
        }

        let cart = await Cart.findOne({ user: userId });

        if (!cart) {
            cart = await Cart.create({
                user: userId,
                items: [{ product: productId, quantity, price, variantId, size, color }],
                totalPrice: price * quantity,
            });
        } else {
            // Check if product already in cart
            const existingIndex = cart.items.findIndex(
                (item) => item.product.toString() === productId &&
                    (variantId ? item.variantId?.toString() === variantId : true)
            );

            if (existingIndex > -1) {
                cart.items[existingIndex].quantity += quantity;
            } else {
                cart.items.push({ product: productId, quantity, price, variantId, size, color });
            }

            // Recalculate total
            cart.totalPrice = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
            await cart.save();
        }

        const populated = await Cart.findById(cart._id)
            .populate("items.product", "name slug images price salePrice stock");

        return res.status(200).json({
            status: true,
            message: "Item added to cart",
            data: populated,
        });
    } catch (error) {
        console.log("Add To Cart Error:", error);
        return res.status(500).json({ status: false, message: error.message });
    }
};

/* =========================
   GET CART
========================= */
controller.getCart = async (req: any, res: any) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id })
            .populate("items.product", "name slug images price salePrice stock");

        if (!cart) {
            return res.status(200).json({ status: true, data: { items: [], totalPrice: 0 } });
        }

        return res.status(200).json({ status: true, data: cart });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

/* =========================
   UPDATE ITEM QUANTITY
========================= */
controller.updateQuantity = async (req: any, res: any) => {
    try {
        const { quantity } = req.body;
        const itemId = req.params.itemId;

        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(200).json({ status: false, message: "Cart not found" });
        }

        const item = cart.items.id(itemId);
        if (!item) {
            return res.status(200).json({ status: false, message: "Item not found in cart" });
        }

        item.quantity = quantity;

        // Recalculate total
        cart.totalPrice = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        await cart.save();

        const populated = await Cart.findById(cart._id)
            .populate("items.product", "name slug images price salePrice stock");

        return res.status(200).json({
            status: true,
            message: "Cart updated",
            data: populated,
        });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

/* =========================
   REMOVE ITEM FROM CART
========================= */
controller.removeItem = async (req: any, res: any) => {
    try {
        const itemId = req.params.itemId;

        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(200).json({ status: false, message: "Cart not found" });
        }

        cart.items = cart.items.filter((item) => item._id.toString() !== itemId) as any;

        // Recalculate total
        cart.totalPrice = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        await cart.save();

        return res.status(200).json({ status: true, message: "Item removed from cart", data: cart });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

/* =========================
   CLEAR CART
========================= */
controller.clearCart = async (req: any, res: any) => {
    try {
        await Cart.findOneAndUpdate(
            { user: req.user._id },
            { items: [], totalPrice: 0 },
            { new: true }
        );

        return res.status(200).json({ status: true, message: "Cart cleared" });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
};

export default controller;
