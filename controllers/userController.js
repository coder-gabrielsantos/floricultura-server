const User = require("../models/User");
const Address = require("../models/Address");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// Generate JWT token with user ID and role
const generateToken = (userId, role) => {
    return jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: "5d" });
};

/**
 * Register a new user
 */
exports.register = async (req, res) => {
    try {
        const { name, phone, password } = req.body;

        if (!name || !phone || !password) {
            return res.status(400).json({ message: "Preencha todos os campos obrigatórios." });
        }

        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            return res.status(400).json({ message: "Telefone já cadastrado." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            phone,
            password: hashedPassword
        });

        const token = generateToken(user._id, user.role);

        res.status(201).json({
            _id: user._id,
            name: user.name,
            phone: user.phone,
            role: user.role,
            token
        });
    } catch (err) {
        console.error("Erro no registro:", err.message);
        res.status(500).json({ message: "Erro ao registrar usuário." });
    }
};

/**
 * Login with phone and password
 */
exports.login = async (req, res) => {
    try {
        const { phone, password } = req.body;

        if (!phone || !password) {
            return res.status(400).json({ message: "Telefone e senha são obrigatórios." });
        }

        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(404).json({ message: "Usuário não encontrado." });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: "Senha incorreta." });
        }

        const token = generateToken(user._id, user.role);

        res.json({
            _id: user._id,
            name: user.name,
            phone: user.phone,
            role: user.role,
            token
        });
    } catch (err) {
        console.error("Erro no login:", err.message);
        res.status(500).json({ message: "Erro ao fazer login." });
    }
};

/**
 * Get logged-in user data (including addresses)
 */
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "Usuário não encontrado." });
        }

        const addresses = await Address.find({ client: req.userId });

        res.json({
            _id: user._id,
            name: user.name,
            phone: user.phone,
            role: user.role,
            addresses,
        });
    } catch (err) {
        res.status(500).json({ message: "Erro ao buscar dados do usuário.", error: err });
    }
};

/**
 * Update user data (name, phone and password)
 */
exports.updateMe = async (req, res) => {
    try {
        const { name, phone, currentPassword, newPassword } = req.body;

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: "Usuário não encontrado." });
        }

        // If user wants to change password
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ message: "Informe a senha atual para alterá-la." });
            }

            const match = await bcrypt.compare(currentPassword, user.password);
            if (!match) {
                return res.status(401).json({ message: "Senha atual incorreta." });
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
        res.status(500).json({ message: "Erro ao atualizar dados do usuário.", error: err.message });
    }
};
