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
        const catalogs = await Catalog.find().populate("products", "name price");
        res.json(catalogs);
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
        const updated = await Catalog.findByIdAndUpdate(req.params.id, req.body, { new: true });
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
