const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const Address = require("../models/Address");
const mongoose = require("mongoose");

const { confirmOrder } = require("../services/orderService");

const MAX_ORDERS_PER_BLOCK = 3;

exports.createOrder = async (req, res) => {
    try {
        const {
            receiverName,
            cardMessage,
            date,
            timeBlock,
            deliveryType,
            paymentMethod,
            address,
            products
        } = req.body;

        const clientId = req.user.userId;

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ message: "Lista de produtos inválida ou vazia" });
        }

        // ✅ Verificar apenas pedidos confirmados
        const existingOrders = await Order.countDocuments({
            date,
            timeBlock,
            status: "confirmado"
        });

        if (existingOrders >= MAX_ORDERS_PER_BLOCK) {
            return res.status(400).json({
                message: "Bloco de horário cheio. Por favor, selecione outro horário"
            });
        }

        if (deliveryType === "entrega") {
            if (!address) {
                return res.status(400).json({ message: "Endereço obrigatório para entrega" });
            }

            const savedAddress = await Address.findOne({ _id: address, client: clientId });
            if (!savedAddress) {
                return res.status(404).json({ message: "Endereço não encontrado ou não autorizado" });
            }
        }

        for (const item of products) {
            const productId = new mongoose.Types.ObjectId(item.product);
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ message: "Produto não encontrado" });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({
                    message: `Estoque insuficiente para o produto: ${product.name}`
                });
            }
        }

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
            status: "pendente"
        });

        await order.save();

        await User.findByIdAndUpdate(clientId, {
            $push: { orders: order._id }
        });

        return res.status(201).json({ message: "Pedido criado com sucesso", order });
    } catch (err) {
        return res.status(500).json({ message: "Erro ao criar pedido", error: err.message });
    }
};

exports.getOrders = async (req, res) => {
    try {
        const isAdmin = req.user.role === "admin";
        const query = isAdmin
            ? { status: { $ne: "pendente" } }
            : { client: req.user.userId, status: { $ne: "pendente" } };

        const orders = await Order.find(query)
            .populate("client", "name email phone")
            .populate("products.product", "name price")
            .populate("address")
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch orders", error: err });
    }
};

exports.getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ client: req.user.userId })
            .populate("products.product")
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: "Erro ao buscar pedidos do cliente", error: err.message });
    }
};

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

        // ✅ Considerar apenas pedidos confirmados
        const blockCounts = await Order.aggregate([
            { $match: { date, status: "confirmado" } },
            { $group: { _id: "$timeBlock", count: { $sum: 1 } } }
        ]);

        const countMap = {};
        blockCounts.forEach(block => {
            countMap[block._id] = block.count;
        });

        const availableBlocks = allBlocks.filter(block => (countMap[block] || 0) < 3);

        res.json({ date, availableBlocks });
    } catch (err) {
        res.status(500).json({ message: "Failed to get available blocks", error: err });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ["pendente", "confirmado", "cancelado", "entregue"];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Se for confirmado, usa a lógica completa do serviço
        if (status === "confirmado") {
            await confirmOrder(id);
        } else {
            order.status = status;
            await order.save();
        }

        res.json({ message: "Order status updated", order });
    } catch (err) {
        res.status(500).json({ message: "Failed to update order status", error: err });
    }
};

// Automatically cancel pending orders older than 30 minutes and restore stock
exports.cleanupPendingOrders = async (req, res) => {
    try {
        const cutoff = new Date(Date.now() - 10 * 60 * 1000); // 10 minutos atrás

        const expiredOrders = await Order.find({
            status: "pendente",
            createdAt: { $lt: cutoff }
        });

        for (const order of expiredOrders) {
            await Order.findByIdAndDelete(order._id);
            console.log(`🗑️ Pedido ${order._id} removido por inatividade.`);
        }

        res.json({ message: `Limpeza concluída: ${expiredOrders.length} pedidos removidos.` });
    } catch (err) {
        console.error("Erro na limpeza de pedidos:", err);
        res.status(500).json({ error: "Erro interno na limpeza de pedidos" });
    }
};
