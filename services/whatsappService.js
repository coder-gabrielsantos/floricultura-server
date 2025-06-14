const axios = require("axios");
require("dotenv").config(); // Load environment variables

const ADM_PHONE = process.env.ADM_PHONE;
const API_KEY = process.env.CALLMEBOT_API_KEY;

/**
 * Send order summary to admin via WhatsApp using CallMeBot API
 */
exports.sendOrderNotification = async (message) => {
    try {
        const url = `https://api.callmebot.com/whatsapp.php?phone=${ADM_PHONE}&text=${encodeURIComponent(message)}&apikey=${API_KEY}`;
        await axios.get(url);
    } catch (error) {
        console.error("Erro ao enviar mensagem WhatsApp:", error.message);
    }
};
