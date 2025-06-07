const mongoose = require("mongoose");

/**
 * Catalog schema
 * Represents a group of products with optional cover image
 */
const catalogSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    coverImage: {
        data: Buffer,
        contentType: String,
    },
    products: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
        }
    ],
}, {
    timestamps: true,
});

module.exports = mongoose.model("Catalog", catalogSchema);
