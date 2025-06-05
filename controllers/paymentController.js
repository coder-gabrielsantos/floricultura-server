const { preference } = require("../config/mercadoPago");
const Order = require("../models/Order");

exports.createPreference = async (req, res) => {
    try {
        const { description, price, quantity, orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ message: "orderId é obrigatório para o pagamento" });
        }

        const preferenceData = {
            items: [
                {
                    title: description,
                    unit_price: Number(price),
                    quantity: Number(quantity),
                },
            ],
            back_urls: {
                success: "https://santateresinha.vercel.app/sucesso",
                failure: "https://santateresinha.vercel.app/falha",
                pending: "https://santateresinha.vercel.app/pendente",
            },
            auto_return: "approved",
            metadata: {
                order_id: orderId
            }
        };

        const response = await preference.create({ body: preferenceData });

        // ⏳ Agendar remoção automática do pedido após 10 minutos, se ainda estiver pendente
        setTimeout(async () => {
            try {
                const order = await Order.findById(orderId);
                if (order && order.status === "pendente") {
                    await Order.findByIdAndDelete(orderId);
                }
            } catch (err) {
                console.error("Erro ao tentar apagar pedido pendente:", err.message);
            }
        }, 10 * 60 * 1000); // 10 minutos

        res.status(200).json({ init_point: response.init_point });
    } catch (error) {
        res.status(500).json({
            message: "Erro ao criar preferência",
            error: error.message,
            details: error.response?.data || null
        });
    }
};
