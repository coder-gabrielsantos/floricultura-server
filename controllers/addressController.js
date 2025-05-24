const Address = require("../models/Address");

exports.createAddress = async (req, res) => {
    try {
        const { street, number, neighborhood, reference, complement } = req.body;

        const newAddress = new Address({
            client: req.userId,
            street,
            number,
            neighborhood,
            reference,
            complement
        });

        await newAddress.save();
        res.status(201).json(newAddress);
    } catch (err) {
        res.status(500).json({ message: "Failed to save address", error: err });
    }
};

exports.getAddresses = async (req, res) => {
    try {
        const clientId = req.user.userId;
        const addresses = await Address.find({ client: clientId }).sort({ createdAt: -1 });
        res.json(addresses);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch addresses", error: err });
    }
};

exports.getAddressById = async (req, res) => {
    try {
        const address = await Address.findById(req.params.id);

        if (!address) {
            return res.status(404).json({ message: "Address not found" });
        }

        if (address.client.toString() !== req.userId) {
            return res.status(403).json({ message: "Access denied" });
        }

        res.json(address);
    } catch (err) {
        res.status(500).json({ message: "Failed to retrieve address", error: err });
    }
};

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
            return res.status(404).json({ message: "Address not found" });
        }

        res.json({ message: "Address updated", address: updated });
    } catch (err) {
        res.status(500).json({ message: "Failed to update address", error: err });
    }
};

exports.deleteAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const clientId = req.user.userId;

        const deleted = await Address.findOneAndDelete({ _id: id, client: clientId });

        if (!deleted) {
            return res.status(404).json({ message: "Address not found" });
        }

        res.json({ message: "Address deleted" });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete address", error: err });
    }
};
