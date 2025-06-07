const mongoose = require("mongoose");

/**
 * Cart schema
 * Represents a user's current cart (one per user)
 */
const cartSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true, // One cart per user
    },
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
                min: 1,
            },
        }
    ],
}, {
    timestamps: true,
});

module.exports = mongoose.model("Cart", cartSchema);
