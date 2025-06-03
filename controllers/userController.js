const User = require("../models/User");
const Address = require("../models/Address");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const generateToken = (userId, role) => {
    return jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: "5d" });
};

// REGISTER
exports.register = async (req, res) => {
    try {
        const { name, identifier, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            password: hashedPassword
        });

        if (identifier.includes("@")) {
            user.email = identifier;
        } else {
            user.phone = identifier;
        }

        await user.save();

        const token = generateToken(user._id, user.role);

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            token
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to register user", error: err });
    }
};

// LOGIN
exports.login = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        const user = await User.findOne({
            $or: [{ email: identifier }, { phone: identifier }]
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Incorrect password" });
        }

        const token = generateToken(user._id, user.role);

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            token
        });
    } catch (err) {
        res.status(500).json({ message: "Login failed", error: err });
    }
};

// GET /me
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.userId)
            .select("-password")
            .populate({
                path: "orders",
                populate: {
                    path: "products.product"
                }
            });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const addresses = await Address.find({ client: req.userId });

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            addresses,
            orders: user.orders
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch user data", error: err });
    }
};

// PUT /me
exports.updateMe = async (req, res) => {
    try {
        const { name, phone, currentPassword, newPassword } = req.body;

        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ message: "Current password is missing" });
            }

            const match = await bcrypt.compare(currentPassword, user.password);
            if (!match) {
                return res.status(401).json({ message: "Incorrect password" });
            }

            user.password = await bcrypt.hash(newPassword, 10);
        }

        if (name) user.name = name;
        if (phone) user.phone = phone;

        await user.save();

        res.json({
            _id: user._id,
            name: user.name,
            phone: user.phone,
            role: user.role
        });
    } catch (err) {
        res.status(500).json({ message: "Error:", error: err.message });
    }
};
