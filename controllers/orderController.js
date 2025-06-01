const Order = require("../models/Order");
const Product = require("../models/Product");
const Address = require("../models/Address");

// Max orders per time block
const MAX_ORDERS_PER_BLOCK = 3;

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

        // Check time block limit
        const existingOrders = await Order.countDocuments({ date, timeBlock });
        if (existingOrders >= MAX_ORDERS_PER_BLOCK) {
            return res.status(400).json({
                message: "Time block is full. Please select another time."
            });
        }

        // Validate deliveryType + address
        if (deliveryType === "entrega") {
            if (!address) {
                return res.status(400).json({
                    message: "Address is required for delivery orders"
                });
            }

            const savedAddress = await Address.findOne({ _id: address, client: clientId });

            if (!savedAddress) {
                return res.status(404).json({ message: "Address not found or not authorized" });
            }
        }

        // Validate product quantities
        for (const item of products) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({
                    message: `Insufficient stock for product: ${product.name}`
                });
            }
        }

        // All validations passed, reduce stock
        for (const item of products) {
            await Product.findByIdAndUpdate(
                item.product,
                { $inc: { stock: -item.quantity } }
            );
        }

        const order = new Order({
            client: clientId,
            products,
            date,
            timeBlock,
            deliveryType,
            address: deliveryType === "entrega" ? address : null,
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

// Automatically cancel pending orders older than 30 minutes and restore stock
exports.cleanupPendingOrders = async (req, res) => {
    try {
        // Define cutoff time: now - 10 minutes
        const cutoff = new Date(Date.now() - 10 * 60 * 1000);

        // Find pending orders older than 30 minutes
        const expiredOrders = await Order.find({
            status: "pending",
            createdAt: { $lt: cutoff }
        });

        for (const order of expiredOrders) {
            // Restore product stock for each item
            for (const item of order.items) {
                await Product.findByIdAndUpdate(item.product, {
                    $inc: { stock: item.quantity }
                });
            }

            // Mark order as canceled
            order.status = "canceled";
            await order.save();
        }

        res.json({
            message: `Cleanup completed: ${expiredOrders.length} order(s) canceled.`
        });
    } catch (err) {
        console.error("Error during pending order cleanup:", err);
        res.status(500).json({ error: "Internal error during cleanup process." });
    }
};
