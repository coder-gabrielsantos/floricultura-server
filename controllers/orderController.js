const Order = require("../models/Order");
const Product = require("../models/Product");
const Address = require("../models/Address");

const { confirmOrder } = require("../services/orderService");

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

        if (deliveryType === "entrega") {
            if (!date || !timeBlock) {
                return res.status(400).json({
                    message: "Data e horário são obrigatórios para entrega"
                });
            }

            const existingOrders = await Order.countDocuments({
                date,
                timeBlock,
                status: { $in: ["pendente", "confirmado"] }
            });

            if (existingOrders >= MAX_ORDERS_PER_BLOCK) {
                return res.status(400).json({
                    message: "Bloco de horário cheio. Por favor, selecione outro horário"
                });
            }

            if (!address) {
                return res.status(400).json({
                    message: "Endereço obrigatório para entrega"
                });
            }

            const addressId = typeof address === "object" ? address._id : address;
            const savedAddress = await Address.findOne({ _id: addressId, client: clientId });
            if (!savedAddress) {
                return res.status(404).json({
                    message: "Endereço não encontrado ou não autorizado"
                });
            }
        }

        // Valida e reduz o estoque
        for (const item of products) {
            const product = await Product.findById(item.product);
            if (!product || product.stock < item.quantity) {
                return res.status(400).json({ message: `Estoque insuficiente para o produto ${item.product}` });
            }
            product.stock -= item.quantity;
            await product.save();
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

        res.status(201).json(order);
    } catch (error) {
        console.error("Erro ao criar pedido:", error);
        res.status(500).json({ message: "Erro ao criar pedido" });
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

        const availableBlocks = allBlocks.filter((block) => {
            const count = orders.filter((o) => o.timeBlock === block).length;
            return count < MAX_ORDERS_PER_BLOCK;
        });

        res.json({ availableBlocks });
    } catch (err) {
        console.error("Erro ao obter blocos disponíveis:", err);
        res.status(500).json({ message: "Erro interno ao buscar blocos" });
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

// Automatically cancel pending orders older than 15 minutes and restore stock
exports.cleanupPendingOrders = async (req, res) => {

    res.json({ message: Date.now() });

    try {
        const cutoff = new Date(Date.now() - 15 * 60 * 1000); // 15 minutos atrás

        const expiredOrders = await Order.find({
            status: "pendente",
            createdAt: { $lt: cutoff }
        });

        for (const order of expiredOrders) {
            // Restaura o estoque
            for (const item of order.products) {
                const product = await Product.findById(item.product);
                if (product) {
                    product.stock += item.quantity;
                    await product.save();
                }
            }

            await Order.findByIdAndDelete(order._id);
            console.log(`🗑️ Pedido ${order._id} removido por inatividade.`);
        }

        res.json({ message: `Limpeza concluída: ${expiredOrders.length} pedidos removidos.` });
    } catch (err) {
        console.error("Erro na limpeza de pedidos:", err);
        res.status(500).json({ error: "Erro interno na limpeza de pedidos" });
    }
};
