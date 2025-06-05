const mongoose = require("mongoose");

const CATEGORIES = [
    "Arranjo Floral",
    "Buquê",
    "Casamento",
    "Coroa e Arranjo Fúnebre",
    "Flor Individual",
    "Ramalhete"
];

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    stock: {
        type: Number,
        required: true
    },
    description: {
        type: String
    },
    category: {
        type: String,
        enum: CATEGORIES,
    },
    images: [
        {
            data: Buffer,
            contentType: String
        }
    ]
}, {
    timestamps: true
});

module.exports = mongoose.model("Product", productSchema);
