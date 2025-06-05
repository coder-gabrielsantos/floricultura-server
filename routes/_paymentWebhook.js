const express = require("express");
const router = express.Router();
const { MercadoPagoConfig, Payment } = require("mercadopago");
const { confirmOrder } = require("../services/orderService");

const mp = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN
});

const payment = new Payment(mp);

router.post("/", async (req, res) => {
    try {
        const paymentId = req.body.data?.id;
        const topic = req.body.type;

        if (topic !== "payment" || !paymentId) {
            return res.status(400).json({ message: "Invalid webhook event" });
        }

        const result = await payment.get({ id: paymentId });
        const status = result.status;
        const orderId = result.metadata?.order_id;

        if (status === "approved" && orderId) {
            await confirmOrder(orderId);
        }

        res.sendStatus(200);
    } catch (err) {
        console.error("❌ Erro no webhook:", err.message);
        res.sendStatus(500);
    }
});

module.exports = router;
