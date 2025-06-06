const { preference } = require("../config/mercadoPago");
const Order = require("../models/Order");

exports.createPreference = async (req, res) => {
    try {
        const { description, price, quantity, orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ message: "orderId é obrigatório para o pagamento" });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Pedido não encontrado" });
        }

        const totalPrice = order.deliveryType === "entrega"
            ? Number(price) + 10
            : Number(price);

        const preferenceData = {
            items: [
                {
                    title: description,
                    unit_price: totalPrice,
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

        res.status(200).json({ init_point: response.init_point });
    } catch (error) {
        res.status(500).json({
            message: "Erro ao criar preferência",
            error: error.message,
            details: error.response?.data || null
        });
    }
};
