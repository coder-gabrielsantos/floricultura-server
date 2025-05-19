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

// Get available time blocks for a specific date
exports.getAvailableBlocks = async (req, res) => {
    try {
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ message: "Date is required" });
        }

        const allBlocks = [
            "06:00–08:00",
            "08:00–10:00",
            "10:00–12:00",
            "12:00–14:00",
            "14:00–16:00",
            "16:00–18:00"
        ];

        const blockCounts = await Order.aggregate([
            { $match: { date } },
            {
                $group: {
                    _id: "$timeBlock",
                    count: { $sum: 1 }
                }
            }
        ]);

        const countMap = {};
        blockCounts.forEach(block => {
            countMap[block._id] = block.count;
        });

        const availableBlocks = allBlocks.filter(block => {
            return (countMap[block] || 0) < 3;
        });

        res.json({ date, availableBlocks });
    } catch (err) {
        res.status(500).json({ message: "Failed to get available blocks", error: err });
    }
};

// Update order status (admin only)
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ["pendente", "confirmado", "cancelado", "entregue"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        const order = await Order.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        ).populate("client", "name");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json({ message: "Order status updated", order });
    } catch (err) {
        res.status(500).json({ message: "Failed to update order status", error: err });
    }
};
