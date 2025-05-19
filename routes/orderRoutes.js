const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { verifyToken } = require("../middleware/authMiddleware");

// Create new order
router.post("/", verifyToken, orderController.createOrder);

// Get all (admin) or personal orders (client)
router.get("/", verifyToken, orderController.getOrders);

module.exports = router;
