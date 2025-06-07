const Product = require("../models/Product");
const Catalog = require("../models/Catalog");
const Cart = require("../models/Cart");
const mongoose = require("mongoose");

/**
 * Create a new product (admin only)
 */
exports.createProduct = async (req, res) => {
    try {
        const {
            name,
            price,
            stock,
            description,
            images, // Array of { base64, contentType }
            catalogs, // Array of catalog IDs
            category
        } = req.body;

        // Convert base64 images to buffer
        const imageBuffers = (images || []).map(img => ({
            data: Buffer.from(img.base64, "base64"),
            contentType: img.contentType
        }));

        const product = new Product({
            name,
            price,
            stock,
            description,
            category,
            images: imageBuffers,
        });

        await product.save();

        // Associate product with selected catalogs
        if (catalogs && catalogs.length > 0) {
            await Catalog.updateMany(
                { _id: { $in: catalogs } },
                { $addToSet: { products: product._id } }
            );
        }

        res.status(201).json({ message: "Produto criado com sucesso.", product });
    } catch (err) {
        res.status(500).json({ message: "Erro ao criar produto.", error: err });
    }
};

/**
 * Get all products or filter by catalog ID
 */
exports.getAllProducts = async (req, res) => {
    try {
        const catalogId = req.query.catalog;

        if (catalogId) {
            if (!mongoose.Types.ObjectId.isValid(catalogId)) {
                return res.status(400).json({ message: "ID de catálogo inválido." });
            }

            const catalog = await Catalog.findById(catalogId);
            if (!catalog) {
                return res.status(404).json({ message: "Catálogo não encontrado." });
            }

            const products = await Product.find({
                _id: { $in: catalog.products }
            }).sort({ createdAt: -1 });

            return res.json(products);
        }

        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: "Erro ao buscar produtos.", error: err });
    }
};

/**
 * Get a single product by ID
 */
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Produto não encontrado." });
        }

        res.json(product);
    } catch (err) {
        res.status(500).json({ message: "Erro ao buscar produto.", error: err });
    }
};

/**
 * Update product data and associated catalogs
 */
exports.updateProduct = async (req, res) => {
    try {
        const {
            name,
            price,
            stock,
            description,
            images,
            catalogs,
            category
        } = req.body;

        // Convert images to buffer
        const imageBuffers = (images || []).map(img => ({
            data: Buffer.from(img.base64, "base64"),
            contentType: img.contentType
        }));

        const updated = await Product.findByIdAndUpdate(
            req.params.id,
            {
                name,
                price,
                stock,
                description,
                category,
                images: imageBuffers
            },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "Produto não encontrado." });
        }

        // Remove product from all catalogs and re-add to selected ones
        await Catalog.updateMany({}, { $pull: { products: updated._id } });

        if (catalogs && catalogs.length > 0) {
            await Catalog.updateMany(
                { _id: { $in: catalogs } },
                { $addToSet: { products: updated._id } }
            );
        }

        res.json({ message: "Produto atualizado com sucesso.", product: updated });
    } catch (err) {
        res.status(500).json({ message: "Erro ao atualizar produto.", error: err });
    }
};

/**
 * Delete a product and remove it from all carts
 */
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await Product.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ message: "Produto não encontrado." });
        }

        // Remove product from any carts
        await Cart.updateMany(
            {},
            { $pull: { items: { product: deleted._id } } }
        );

        res.json({ message: "Produto excluído com sucesso." });
    } catch (err) {
        res.status(500).json({ message: "Erro ao excluir produto.", error: err });
    }
};
