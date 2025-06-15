const mongoose = require("mongoose");
require("dotenv").config();

// Check current environment (default to 'development' if undefined)
const NODE_ENV = process.env.NODE_ENV || "development";

// Select the correct MongoDB URI based on environment
const MONGO_URI =
    NODE_ENV === "test" ? process.env.MONGO_URI_TEST : process.env.MONGO_URI;

/**
 * Connects to MongoDB depending on the environment (test or production)
 */
const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log(`✅ Conectado ao MongoDB (${NODE_ENV} environment)`);
    } catch (err) {
        console.error("❌  Falha ao conectar no MongoDB:", err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
