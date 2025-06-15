const Order = require("../models/Order");
const Product = require("../models/Product");
const Address = require("../models/Address");
const { confirmOrder } = require("../services/orderService");

/**
 * Create a new order after validating stock, delivery info, and scheduling
 */
exports.createOrder = async (req, res) => {
    try {
        const clientId = req.user.userId;
        const {
            products,
            date,
            timeBlock,
            deliveryType,
            address,
            receiverName,
            cardMessage,
            paymentMethod
        } = req.body;

        const MAX_ORDERS_PER_BLOCK = 3;

        // If delivery, validate date, timeBlock and address
        if (deliveryType === "entrega") {
            if (!date || !timeBlock) {
                return res.status(400).json({ message: "Data e horário são obrigatórios para entrega." });
            }

            const existingOrders = await Order.countDocuments({
                date,
                timeBlock,
                status: { $in: ["pendente", "confirmado"] }
            });

            if (existingOrders >= MAX_ORDERS_PER_BLOCK) {
                return res.status(400).json({ message: "Bloco de horário cheio. Por favor, selecione outro horário." });
            }

            if (!address) {
                return res.status(400).json({ message: "Endereço obrigatório para entrega." });
            }

            const addressId = typeof address === "object" ? address._id : address;
            const savedAddress = await Address.findOne({ _id: addressId, client: clientId });
            if (!savedAddress) {
                return res.status(404).json({ message: "Endereço não encontrado ou não autorizado." });
            }
        }

        // Validate product stock and update it
        for (const item of products) {
            const product = await Product.findById(item.product);
            if (!product || product.stock < item.quantity) {
                return res.status(400).json({
                    message: `Estoque insuficiente para o produto ${item.product}`
                });
            }
            product.stock -= item.quantity;
            await product.save();
        }

        // Create order
        const order = new Order({
            client: clientId,
            products,
            date,
            timeBlock,
            deliveryType,
            address: deliveryType === "entrega" ? address : null,
            receiverName,
            cardMessage,
            paymentMethod,
            status: paymentMethod === "especie" ? "confirmado" : "pendente"
        });

        await order.save();

        res.status(201).json(order);
    } catch (error) {
        console.error("Erro ao criar pedido:", error);
        res.status(500).json({ message: "Erro ao criar pedido." });
    }
};

/**
 * Get all orders - admin sees all, user sees only their own
 */
exports.getOrders = async (req, res) => {
    try {
        const isAdmin = req.user.role === "admin";
        const query = isAdmin ? {} : { client: req.user.userId };

        const orders = await Order.find(query)
            .populate("client", "name email phone")
            .populate("products.product", "name price")
            .populate("address")
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: "Erro ao buscar pedidos.", error: err });
    }
};

/**
 * Get only the orders from the logged-in user
 */
exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ client: req.user.userId })
            .populate("products.product")
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: "Erro ao buscar seus pedidos.", error: err.message });
    }
};

/**
 * Return available delivery time blocks for a given date
 */
exports.getAvailableBlocks = async (req, res) => {
    try {
        const { date } = req.query;
        const MAX_ORDERS_PER_BLOCK = 3;

        const allBlocks = [
            "06:00–08:00",
            "08:00–10:00",
            "10:00–12:00",
            "12:00–14:00",
            "14:00–16:00",
            "16:00–18:00"
        ];

        const orders = await Order.find({
            date,
            status: { $in: ["pendente", "confirmado"] }
        });

        // Filter blocks based on how many orders already exist
        const availableBlocks = allBlocks.filter((block) => {
            const count = orders.filter((o) => o.timeBlock === block).length;
            return count < MAX_ORDERS_PER_BLOCK;
        });

        res.json({ availableBlocks });
    } catch (err) {
        console.error("Erro ao obter blocos disponíveis:", err);
        res.status(500).json({ message: "Erro interno ao buscar blocos disponíveis." });
    }
};

/**
 * Update the status of a given order
 */
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ["pendente", "confirmado", "cancelado", "entregue"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Status inválido." });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: "Pedido não encontrado." });
        }

        // Use special logic when confirming the order
        if (status === "confirmado") {
            await confirmOrder(id);
        } else {
            order.status = status;
            await order.save();
        }

        res.json({ message: "Status do pedido atualizado com sucesso.", order });
    } catch (err) {
        res.status(500).json({ message: "Erro ao atualizar status do pedido.", error: err });
    }
};

/**
 * Clean up pending orders older than 15 minutes and restore stock
 */
exports.cleanupPendingOrders = async (req, res) => {
    try {
        const cutoff = new Date(Date.now() - 15 * 60 * 1000); // 15 minutos atrás

        const expiredOrders = await Order.find({
            status: "pendente",
            createdAt: { $lt: cutoff }
        });

        for (const order of expiredOrders) {
            // Restaurar estoque
            for (const item of order.products) {
                const product = await Product.findById(item.product);
                if (product) {
                    product.stock += item.quantity;
                    await product.save();
                }
            }

            // Atualizar status para cancelado
            order.status = "cancelado";
            await order.save();
            console.log(`🚫 Pedido ${order._id} cancelado por inatividade.`);
        }

        res.json({ message: `Limpeza concluída: ${expiredOrders.length} pedidos cancelados.` });
    } catch (err) {
        console.error("Erro na limpeza de pedidos:", err);
        res.status(500).json({ message: "Erro interno na limpeza de pedidos." });
    }
};
