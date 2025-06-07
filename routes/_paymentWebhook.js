const express = require("express");
const router = express.Router();
const { MercadoPagoConfig, Payment } = require("mercadopago");
const { confirmOrder } = require("../services/orderService");

// Initialize Mercado Pago configuration
const mp = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
});

const payment = new Payment(mp);

/**
 * Webhook listener for Mercado Pago payment events
 */
router.post("/", async (req, res) => {
    try {
        const paymentId = req.body.data?.id;
        const topic = req.body.type;

        // Validate event type and ID
        if (topic !== "payment" || !paymentId) {
            return res.status(400).json({ message: "Evento de webhook inválido." });
        }

        // Retrieve full payment information from Mercado Pago
        const result = await payment.get({ id: paymentId });
        const status = result.status;
        const orderId = result.metadata?.order_id;

        // Confirm the order if payment was approved
        if (status === "approved" && orderId) {
            await confirmOrder(orderId);
        }

        res.sendStatus(200);
    } catch (err) {
        console.error("❌ Erro no webhook:", err.message);
        res.sendStatus(500); // Don't return detailed errors to the payment provider
    }
});

module.exports = router;
