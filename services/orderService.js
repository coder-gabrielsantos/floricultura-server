const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const User = require("../models/User");
const { sendOrderNotification } = require("./whatsappService");

/**
 * Builds a summary message for a confirmed order to send via WhatsApp
 */
async function buildOrderMessage(order, user) {
    let itemsText = "";
    let total = 0;

    for (const item of order.products) {
        const product = await Product.findById(item.product);
        if (product) {
            const subtotal = product.price * item.quantity;
            total += subtotal;
            itemsText += `\n- ${product.name} x${item.quantity} = R$ ${subtotal.toFixed(2)}`;
        }
    }

    // Format final message with indentation
    return `🛍️ *Nova compra realizada!*

Cliente: ${user.name}
Telefone: ${user.phone}
Data: ${order.date || "-"}
Horário: ${order.timeBlock || "-"}
Pagamento: ${order.paymentMethod}

*Itens comprados:*
${itemsText
        .split("\n")
        .filter((item) => item.trim())
        .map((item) => `  - ${item.trim()}`)
        .join("\n")}

*Total:* R$ ${total.toFixed(2)}`;
}

/**
 * Confirm an order: set status, delete cart, notify admin
 */
exports.confirmOrder = async (orderId) => {
    try {
        const order = await Order.findById(orderId).populate("client", "name phone");

        // Skip if order not found or already confirmed
        if (!order || order.status === "confirmado") return;

        order.status = "confirmado";
        await order.save();

        // Clear user's cart
        await Cart.findOneAndDelete({ client: order.client._id });

        // Send WhatsApp notification
        const user = await User.findById(order.client._id);
        const summary = await buildOrderMessage(order, user);
        await sendOrderNotification(summary);

        console.log(`✅ Pedido ${orderId} confirmado e notificado com sucesso.`);
    } catch (error) {
        console.error("❌ Erro ao confirmar pedido:", error.message);
    }
};
