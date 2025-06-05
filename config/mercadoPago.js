const { MercadoPagoConfig, Preference } = require("mercadopago");

const mercadoPago = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN
});

module.exports = {
    preference: new Preference(mercadoPago)
};
