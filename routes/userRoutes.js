const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { verifyToken } = require("../middleware/authMiddleware");

/**
 * User authentication and profile routes
 */
router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/me", verifyToken, userController.getMe);
router.put("/me", verifyToken, userController.updateMe);

module.exports = router;
