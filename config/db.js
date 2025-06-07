const mongoose = require("mongoose");

/**
 * Connects to MongoDB depending on the environment (test or production)
 */
const connectDB = async () => {
    try {
        const uri =
            process.env.NODE_ENV === "test"
                ? process.env.MONGO_URI_TEST
                : process.env.MONGO_URI;

        await mongoose.connect(uri);
        console.log("✅  Conectado ao MongoDB:", process.env.NODE_ENV || "development");
    } catch (err) {
        console.error("❌  Falha ao conectar no MongoDB:", err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
