const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");

/**
 * Product routes
 * Public: view products
 * Admin: create, update, delete
 */
router.get("/", productController.getAllProducts);
router.post("/", verifyToken, requireAdmin, productController.createProduct);
router.delete("/:id", verifyToken, requireAdmin, productController.deleteProduct);
router.get("/:id", verifyToken, requireAdmin, productController.getProductById);
router.put("/:id", verifyToken, requireAdmin, productController.updateProduct);

module.exports = router;
