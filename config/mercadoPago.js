const { MercadoPagoConfig, Preference } = require("mercadopago");

/**
 * Initializes Mercado Pago client using access token from .env
 */
const mercadoPago = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
});

/**
 * Exports the configured Preference instance for payment creation
 */
module.exports = {
    preference: new Preference(mercadoPago),
};
