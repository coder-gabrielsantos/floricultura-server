const Cart = require("../models/Cart");

exports.getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ client: req.userId }).populate("items.product");
        res.json(cart || { items: [] });
    } catch (err) {
        res.status(500).json({ message: "Failed to load cart", error: err });
    }
};

exports.addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        let cart = await Cart.findOne({ client: req.userId });

        if (!cart) {
            cart = new Cart({
                client: req.userId,
                items: [{ product: productId, quantity }]
            });
        } else {
            const index = cart.items.findIndex((item) => item.product.toString() === productId);
            if (index !== -1) {
                cart.items[index].quantity += quantity;
            } else {
                cart.items.push({ product: productId, quantity });
            }
        }

        await cart.save();
        res.json(cart);
    } catch (err) {
        res.status(500).json({ message: "Failed to add to cart", error: err });
    }
};

exports.updateItem = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const cart = await Cart.findOne({ client: req.userId });

        if (!cart) return res.status(404).json({ message: "Cart not found" });

        const item = cart.items.find((i) => i.product.toString() === productId);
        if (!item) return res.status(404).json({ message: "Item not found" });

        item.quantity = quantity;
        await cart.save();
        res.json(cart);
    } catch (err) {
        res.status(500).json({ message: "Failed to update item", error: err });
    }
};

exports.removeItem = async (req, res) => {
    try {
        const cart = await Cart.findOne({ client: req.userId });
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        cart.items = cart.items.filter((i) => i.product.toString() !== req.params.id);
        await cart.save();
        res.json(cart);
    } catch (err) {
        res.status(500).json({ message: "Failed to remove item", error: err });
    }
};

exports.clearCart = async (req, res) => {
    try {
        await Cart.findOneAndDelete({ client: req.userId });
        res.json({ message: "Cart cleared" });
    } catch (err) {
        res.status(500).json({ message: "Failed to clear cart", error: err });
    }
};
