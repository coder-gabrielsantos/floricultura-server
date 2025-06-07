const mongoose = require("mongoose");

/**
 * Address schema
 * Stores delivery addresses associated with a user
 */
const addressSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    street: {
        type: String,
        required: true,
    },
    number: {
        type: String,
        required: true,
    },
    neighborhood: {
        type: String,
        required: true,
    },
    reference: {
        type: String,
        required: true,
    },
    complement: {
        type: String,
    },
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt
});

module.exports = mongoose.model("Address", addressSchema);
