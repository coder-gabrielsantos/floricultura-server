const mongoose = require("mongoose");

const catalogSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    products: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product"
        }
    ]
}, {
    timestamps: true
});

module.exports = mongoose.model("Catalog", catalogSchema);
