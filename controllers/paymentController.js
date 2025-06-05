const { preference } = require("../config/mercadoPago");

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
        res.status(200).json({ init_point: response.init_point });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao criar preferência", error: error.message });
    }
};
