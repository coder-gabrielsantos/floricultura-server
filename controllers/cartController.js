const Cart = require("../models/Cart");

/**
 * Retrieve the cart of the logged-in user
 */
exports.getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ client: req.userId }).populate("items.product");

        // If no cart exists, return an empty list
        res.json(cart || { items: [] });
    } catch (err) {
        res.status(500).json({ message: "Erro ao carregar o carrinho.", error: err });
    }
};

/**
 * Add a product to the user's cart
 */
exports.addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        let cart = await Cart.findOne({ client: req.userId });

        if (!cart) {
            // Create new cart if none exists
            cart = new Cart({
                client: req.userId,
                items: [{ product: productId, quantity }],
            });
        } else {
            // Check if product already exists in cart
            const index = cart.items.findIndex((item) => item.product.toString() === productId);

            if (index !== -1) {
                // Increase quantity if item already exists
                cart.items[index].quantity += quantity;
            } else {
                // Add new product to cart
                cart.items.push({ product: productId, quantity });
            }
        }

        await cart.save();

        res.json(cart);
    } catch (err) {
        res.status(500).json({ message: "Erro ao adicionar ao carrinho.", error: err });
    }
};

/**
 * Update the quantity of a specific item in the cart
 */
exports.updateItem = async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        const cart = await Cart.findOne({ client: req.userId });
        if (!cart) return res.status(404).json({ message: "Carrinho não encontrado." });

        const item = cart.items.find((i) => i.product.toString() === productId);
        if (!item) return res.status(404).json({ message: "Item não encontrado no carrinho." });

        item.quantity = quantity;

        await cart.save();

        res.json(cart);
    } catch (err) {
        res.status(500).json({ message: "Erro ao atualizar o item do carrinho.", error: err });
    }
};

/**
 * Remove a specific item from the cart
 */
exports.removeItem = async (req, res) => {
    try {
        const cart = await Cart.findOne({ client: req.userId });
        if (!cart) return res.status(404).json({ message: "Carrinho não encontrado." });

        // Remove item by filtering it out
        cart.items = cart.items.filter((i) => i.product.toString() !== req.params.id);

        await cart.save();

        res.json(cart);
    } catch (err) {
        res.status(500).json({ message: "Erro ao remover item do carrinho.", error: err });
    }
};

/**
 * Clear the entire cart for the user
 */
exports.clearCart = async (req, res) => {
    try {
        await Cart.findOneAndDelete({ client: req.userId });

        res.json({ message: "Carrinho esvaziado com sucesso." });
    } catch (err) {
        res.status(500).json({ message: "Erro ao limpar o carrinho.", error: err });
    }
};
