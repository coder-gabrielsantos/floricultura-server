const Catalog = require("../models/Catalog");

// Create new catalog
exports.createCatalog = async (req, res) => {
    try {
        const catalog = new Catalog(req.body);
        await catalog.save();
        res.status(201).json(catalog);
    } catch (err) {
        res.status(500).json({ message: "Failed to create catalog", error: err });
    }
};

// Get all catalogs
exports.getCatalogs = async (req, res) => {
    try {
        const catalogs = await Catalog.find().populate("products");

        const response = catalogs.map((cat) => {
            const coverImage = cat.coverImage?.data
                ? {
                    base64: cat.coverImage.data.toString("base64"),
                    contentType: cat.coverImage.contentType,
                }
                : null;

            return {
                _id: cat._id,
                name: cat.name,
                products: cat.products,
                coverImage,
            };
        });

        res.json(response);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch catalogs", error: err });
    }
};

// Get single catalog
exports.getCatalogById = async (req, res) => {
    try {
        const catalog = await Catalog.findById(req.params.id).populate("products", "name price");
        if (!catalog) return res.status(404).json({ message: "Catalog not found" });
        res.json(catalog);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch catalog", error: err });
    }
};

// Update catalog
exports.updateCatalog = async (req, res) => {
    try {
        const { name, coverImage } = req.body;

        const updateData = { name };
        if (coverImage?.base64 && coverImage?.contentType) {
            updateData.coverImage = {
                data: Buffer.from(coverImage.base64, "base64"),
                contentType: coverImage.contentType,
            };
        }

        const updated = await Catalog.findByIdAndUpdate(req.params.id, updateData, { new: true });

        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: "Failed to update catalog", error: err });
    }
};

// Delete catalog
exports.deleteCatalog = async (req, res) => {
    try {
        await Catalog.findByIdAndDelete(req.params.id);
        res.json({ message: "Catalog deleted" });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete catalog", error: err });
    }
};
