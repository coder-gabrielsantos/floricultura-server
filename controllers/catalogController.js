const Catalog = require("../models/Catalog");

/**
 * Create a new catalog
 */
exports.createCatalog = async (req, res) => {
    try {
        const catalog = new Catalog(req.body);

        await catalog.save();

        res.status(201).json(catalog);
    } catch (err) {
        res.status(500).json({ message: "Erro ao criar catálogo.", error: err });
    }
};

/**
 * Get all catalogs with product population and formatted cover image
 */
exports.getCatalogs = async (req, res) => {
    try {
        const catalogs = await Catalog.find().populate("products");

        // Map response to include base64 image if available
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
        res.status(500).json({ message: "Erro ao buscar os catálogos.", error: err });
    }
};

/**
 * Get a single catalog by ID with product name and price
 */
exports.getCatalogById = async (req, res) => {
    try {
        const catalog = await Catalog.findById(req.params.id).populate("products", "name price");

        if (!catalog) {
            return res.status(404).json({ message: "Catálogo não encontrado." });
        }

        res.json(catalog);
    } catch (err) {
        res.status(500).json({ message: "Erro ao buscar o catálogo.", error: err });
    }
};

/**
 * Update a catalog by ID, including image if provided
 */
exports.updateCatalog = async (req, res) => {
    try {
        const { name, coverImage } = req.body;

        const updateData = { name };

        // If image data is provided, convert and include it
        if (coverImage?.base64 && coverImage?.contentType) {
            updateData.coverImage = {
                data: Buffer.from(coverImage.base64, "base64"),
                contentType: coverImage.contentType,
            };
        }

        const updated = await Catalog.findByIdAndUpdate(req.params.id, updateData, { new: true });

        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: "Erro ao atualizar o catálogo.", error: err });
    }
};

/**
 * Delete a catalog by ID
 */
exports.deleteCatalog = async (req, res) => {
    try {
        await Catalog.findByIdAndDelete(req.params.id);

        res.json({ message: "Catálogo excluído com sucesso." });
    } catch (err) {
        res.status(500).json({ message: "Erro ao excluir o catálogo.", error: err });
    }
};
