const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    street: {
        type: String,
        required: true
    },
    number: {
        type: String,
        required: true
    },
    neighborhood: {
        type: String,
        required: true
    },
    reference: {
        type: String,
        required: true
    },
    complement: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Address", addressSchema);
