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

module.exports = router;
