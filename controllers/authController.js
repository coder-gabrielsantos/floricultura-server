const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Register new user
exports.register = async (req, res) => {
    try {
        const { name, identifier, password, role } = req.body;

        let email = "";
        let phone = "";

        if (identifier.includes("@")) {
            email = identifier;
        } else {
            phone = identifier;
        }

        // Check if user already exists (by email or phone)
        const existingUser = await User.findOne({
            $or: [{ email }, { phone }]
        });

        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email,
            phone,
            password: hashedPassword,
            role
        });

        await newUser.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error registering user", error: err });
    }
};

// Login with email or phone
exports.login = async (req, res) => {
    try {
        const { identifier, password } = req.body; // identifier = email or phone

        // Find user by email or phone
        const user = await User.findOne({
            $or: [{ email: identifier }, { phone: identifier }]
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "2h" }
        );

        res.json({ token, user: { name: user.name, role: user.role } });
    } catch (err) {
        res.status(500).json({ message: "Login failed", error: err });
    }
};
