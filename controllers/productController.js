const Product = require("../models/Product");
const Catalog = require("../models/Catalog");

// Create new product (admin only)
exports.createProduct = async (req, res) => {
    try {
        const {
            name,
            price,
            stock,
            description,
            images, // Expect array of { base64, contentType }
            catalogs // IDs dos catálogos selecionados
        } = req.body;

        const imageBuffers = (images || []).map(img => ({
            data: Buffer.from(img.base64, "base64"),
            contentType: img.contentType
        }));

        const product = new Product({
            name,
            price,
            stock,
            description,
            images: imageBuffers
        });

        await product.save();

        // Update catalogs
        if (catalogs && catalogs.length > 0) {
            await Catalog.updateMany(
                { _id: { $in: catalogs } },
                { $addToSet: { products: product._id } }
            );
        }

        res.status(201).json({ message: "Product created successfully", product });
    } catch (err) {
        res.status(500).json({ message: "Failed to create product", error: err });
    }
};

// Get all products
exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch products", error: err });
    }
};

// Get product by ID
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.json(product);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch product", error: err });
    }
};

// Update product by ID
exports.updateProduct = async (req, res) => {
    try {
        const {
            name,
            price,
            stock,
            description,
            images,
            catalogs
        } = req.body;

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
                images: imageBuffers
            },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Atualizar catálogos: remover o produto de todos e adicionar nos selecionados
        await Catalog.updateMany({}, { $pull: { products: updated._id } });
        if (catalogs && catalogs.length > 0) {
            await Catalog.updateMany(
                { _id: { $in: catalogs } },
                { $addToSet: { products: updated._id } }
            );
        }

        res.json({ message: "Product updated successfully", product: updated });
    } catch (err) {
        res.status(500).json({ message: "Failed to update product", error: err });
    }
};

// Delete product
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await Product.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json({ message: "Product deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete product", error: err });
    }
};