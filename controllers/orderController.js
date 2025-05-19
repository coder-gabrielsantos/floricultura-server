const Order = require("../models/Order");

// Max orders per time block
const MAX_ORDERS_PER_BLOCK = 3;

// Create a new order
exports.createOrder = async (req, res) => {
    try {
        const {
            products,
            date,
            timeBlock,
            deliveryType,
            address,
            cardMessage,
            paymentMethod
        } = req.body;

        const clientId = req.user.userId;

        // Check if limit for time block is reached
        const existingOrders = await Order.countDocuments({ date, timeBlock });
        if (existingOrders >= MAX_ORDERS_PER_BLOCK) {
            return res.status(400).json({
                message: "Time block is full."
            });
        }

        const order = new Order({
            client: clientId,
            products,
            date,
            timeBlock,
            deliveryType,
            address,
            cardMessage,
            paymentMethod
        });

        await order.save();
        res.status(201).json({ message: "Order created successfully", order });
    } catch (err) {
        res.status(500).json({ message: "Failed to create order", error: err });
    }
};

// Get all orders (admin) or user-specific
exports.getOrders = async (req, res) => {
    try {
        const isAdmin = req.user.role === "admin";

        const query = isAdmin
            ? {}
            : { client: req.user.userId };

        const orders = await Order.find(query)
            .populate("client", "name email phone")
            .populate("products.product", "name price")
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch orders", error: err });
    }
};
