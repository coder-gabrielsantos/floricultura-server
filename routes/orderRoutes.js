const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");

/**
 * Order routes
 * Clients: create and view orders
 * Admin: update status, view all, cleanup
 */
router.post("/", verifyToken, orderController.createOrder);
router.get("/", verifyToken, orderController.getOrders);
router.get("/available-blocks", orderController.getAvailableBlocks);
router.put("/:id/status", verifyToken, requireAdmin, orderController.updateOrderStatus);
router.get("/cleanup-pending", orderController.cleanupPendingOrders);

module.exports = router;
