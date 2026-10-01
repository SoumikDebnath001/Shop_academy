import { User } from '@repo/database';
import { Order } from '@repo/database';
import { Product } from '@repo/database';

const controller: any = {};

controller.getStats = async (req: any, res: any) => {
    try {
        const userCount = await User.countDocuments();
        const productCount = await Product.countDocuments();
        const pendingOrders = await Order.countDocuments({ status: 'pending' }); // assuming status is 'pending'

        // Total orders today
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const ordersToday = await Order.countDocuments({
            createdAt: { $gte: startOfToday, $lte: endOfToday }
        });

        // Total orders (all time)
        const totalOrdersCount = await Order.countDocuments();

        // Out of stock products
        const outOfStockProducts = await Product.countDocuments({ stock: { $lte: 0 } });

        // Total Income (all time, completed/delivered/paid orders or just all for simplicity, let's say all non-cancelled)
        const revenueResult = await Order.aggregate([
            { $match: { status: { $nin: ['cancelled', 'returned'] } } },
            { $group: { _id: null, totalIncome: { $sum: "$totalAmount" } } }
        ]);
        const totalIncome = revenueResult.length > 0 ? revenueResult[0].totalIncome : 0;

        // Total Investment (Estimated as stock * price for all products)
        // Note: since cost price isn't explicitly defined, using price as an estimate of inventory value.
        const investmentResult = await Product.aggregate([
            { $project: { value: { $multiply: ["$stock", "$price"] } } },
            { $group: { _id: null, totalInvestment: { $sum: "$value" } } }
        ]);
        const totalInvestment = investmentResult.length > 0 ? investmentResult[0].totalInvestment : 0;

        res.status(200).json({
            status: true,
            data: {
                userCount,
                productCount,
                pendingOrders,
                ordersToday,
                outOfStockProducts,
                totalIncome,
                totalInvestment,
                totalOrders: totalOrdersCount
            }
        });
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({
            status: false,
            message: "Failed to fetch dashboard statistics",
            error: error.message
        });
    }
};

export default controller;
