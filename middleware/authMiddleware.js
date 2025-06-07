const jwt = require("jsonwebtoken");

/**
 * Middleware to verify JWT token from Authorization header
 */
exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    // Token must be provided in the format: Bearer <token>
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Acesso negado. Token não fornecido." });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user info to request object
        req.userId = decoded.userId;
        req.user = decoded;

        next();
    } catch (err) {
        return res.status(401).json({ message: "Token inválido ou expirado." });
    }
};

/**
 * Middleware to restrict access to admin users only
 */
exports.requireAdmin = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Acesso negado. Apenas administradores." });
    }
    next();
};
