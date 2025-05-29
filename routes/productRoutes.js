const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");

// Public: list products
router.get("/", productController.getAllProducts);

// Admin: create product
router.post("/", verifyToken, requireAdmin, productController.createProduct);

// Admin: delete product
router.delete("/:id", verifyToken, requireAdmin, productController.deleteProduct);

// Admin: get product by ID
router.get("/:id", verifyToken, requireAdmin, productController.getProductById);

// Admin: update product
router.put("/:id", verifyToken, requireAdmin, productController.updateProduct);

module.exports = router;
