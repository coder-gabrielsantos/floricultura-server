const { preference } = require("../config/mercadoPago");
const Order = require("../models/Order");

/**
 * Create a Mercado Pago payment preference for an order
 */
exports.createPreference = async (req, res) => {
    try {
        const { description, price, quantity, orderId } = req.body;

        // Check if the orderId was provided
        if (!orderId) {
            return res.status(400).json({ message: "orderId é obrigatório para o pagamento." });
        }

        // Find the order associated with the given orderId
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Pedido não encontrado." });
        }

        // Add delivery fee if delivery type is "entrega"
        const totalPrice = order.deliveryType === "entrega"
            ? Number(price) + 10
            : Number(price);

        // Define the payment preference object to be sent to Mercado Pago
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

        // Create the payment preference with Mercado Pago API
        const response = await preference.create({ body: preferenceData });

        // Return the payment URL to the frontend
        res.status(200).json({ init_point: response.init_point });
    } catch (error) {
        res.status(500).json({
            message: "Erro ao criar preferência de pagamento.",
            error: error.message,
            details: error.response?.data || null
        });
    }
};
