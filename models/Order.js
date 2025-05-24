const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    receiverName: {
        type: String,
        required: true
    },
    products: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product"
            },
            quantity: {
                type: Number,
                required: true
            }
        }
    ],
    date: {
        type: String,
        required: true
    },
    timeBlock: {
        type: String,
        enum: [
            "06:00–08:00",
            "08:00–10:00",
            "10:00–12:00",
            "12:00–14:00",
            "14:00–16:00",
            "16:00–18:00"
        ],
        required: true
    },
    deliveryType: {
        type: String,
        enum: ["entrega", "retirada"],
        required: true
    },
    address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address"
    },
    cardMessage: {
        type: String,
        maxlength: 120
    },
    paymentMethod: {
        type: String,
        enum: ["pix", "cartao", "especie"],
        required: true
    },
    status: {
        type: String,
        enum: ["pendente", "confirmado", "cancelado", "entregue"],
        default: "pendente"
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Order", orderSchema);
