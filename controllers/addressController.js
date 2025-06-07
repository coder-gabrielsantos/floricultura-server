const Address = require("../models/Address");

/**
 * Create a new address for the logged-in user
 */
exports.createAddress = async (req, res) => {
    try {
        const { street, number, neighborhood, reference, complement } = req.body;

        const newAddress = new Address({
            client: req.userId,
            street,
            number,
            neighborhood,
            reference,
            complement,
        });

        await newAddress.save();

        // Success response in Portuguese
        res.status(201).json(newAddress);
    } catch (err) {
        // Internal server error with debug info
        res.status(500).json({ message: "Erro ao salvar o endereço.", error: err });
    }
};

/**
 * Get all addresses of the current user, sorted by creation date (newest first)
 */
exports.getAddresses = async (req, res) => {
    try {
        const clientId = req.user.userId;

        const addresses = await Address.find({ client: clientId }).sort({ createdAt: -1 });

        res.json(addresses);
    } catch (err) {
        res.status(500).json({ message: "Erro ao buscar os endereços.", error: err });
    }
};

/**
 * Get a specific address by ID, checking user ownership
 */
exports.getAddressById = async (req, res) => {
    try {
        const address = await Address.findById(req.params.id);

        if (!address) {
            return res.status(404).json({ message: "Endereço não encontrado." });
        }

        // Check if the address belongs to the logged-in user
        if (address.client.toString() !== req.userId) {
            return res.status(403).json({ message: "Acesso negado ao endereço." });
        }

        res.json(address);
    } catch (err) {
        res.status(500).json({ message: "Erro ao buscar o endereço.", error: err });
    }
};

/**
 * Update an address by ID if it belongs to the user
 */
exports.updateAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const clientId = req.userId;

        const updated = await Address.findOneAndUpdate(
            { _id: id, client: clientId },
            req.body,
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ message: "Endereço não encontrado." });
        }

        res.json({ message: "Endereço atualizado com sucesso.", address: updated });
    } catch (err) {
        res.status(500).json({ message: "Erro ao atualizar o endereço.", error: err });
    }
};

/**
 * Delete an address by ID if it belongs to the user
 */
exports.deleteAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const clientId = req.userId;

        const deleted = await Address.findOneAndDelete({ _id: id, client: clientId });

        if (!deleted) {
            return res.status(404).json({ message: "Endereço não encontrado." });
        }

        res.json({ message: "Endereço excluído com sucesso." });
    } catch (err) {
        res.status(500).json({ message: "Erro ao excluir o endereço.", error: err });
    }
};
