const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");

// Create new order
router.post("/", verifyToken, orderController.createOrder);

// Get all (admin) or personal orders (client)
router.get("/", verifyToken, orderController.getOrders);

// Get available time blocks for a given date
router.get("/available-blocks", orderController.getAvailableBlocks);

// Admin: update order status
router.put("/:id/status", verifyToken, requireAdmin, orderController.updateOrderStatus);

module.exports = router;
