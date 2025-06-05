const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const User = require("../models/User");
const { sendOrderNotification } = require("./whatsappService");

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

    return `🛍️ *Nova compra realizada!*

Cliente: ${user.name}
Telefone: ${user.phone}
Data: ${order.date}
Horário: ${order.timeBlock}
Pagamento: ${order.paymentMethod}

*Itens comprados:*
${itemsText
        .split("\n")
        .filter((item) => item.trim())
        .map((item) => `  - ${item.trim()}`)
        .join("\n")}

*Total:* R$ ${total.toFixed(2)}`;
}

exports.confirmOrder = async (orderId) => {
    const order = await Order.findById(orderId).populate("client", "name phone");

    if (!order || order.status === "confirmado") return;

    order.status = "confirmado";
    await order.save();

    for (const item of order.products) {
        await Product.findByIdAndUpdate(item.product, {
            $inc: { stock: -item.quantity }
        });
    }

    await Cart.findOneAndDelete({ client: order.client._id });

    const user = await User.findById(order.client._id);
    const summary = await buildOrderMessage(order, user);
    await sendOrderNotification(summary);
};
