const mongoose = require("mongoose");

/**
 * User schema
 * Used for authentication and role-based access
 */
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["client", "admin"],
        default: "client",
    },
});

module.exports = mongoose.model("User", userSchema);
