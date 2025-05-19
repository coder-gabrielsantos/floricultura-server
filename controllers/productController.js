const Product = require("../models/Product");

// Create new product (admin only)
exports.createProduct = async (req, res) => {
    try {
        const {
            name,
            price,
            stock,
            category,
            description,
            images // Expect array of { base64, contentType }
        } = req.body;

        const imageBuffers = (images || []).map(img => ({
            data: Buffer.from(img.base64, "base64"),
            contentType: img.contentType
        }));

        const product = new Product({
            name,
            price,
            stock,
            category,
            description,
            images: imageBuffers
        });

        await product.save();

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
