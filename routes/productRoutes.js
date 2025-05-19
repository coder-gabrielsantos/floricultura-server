const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { verifyToken, requireAdmin } = require("../middlewares/authMiddleware");

// Public: list products
router.get("/", productController.getAllProducts);

// Admin: create product
router.post("/", verifyToken, requireAdmin, productController.createProduct);

module.exports = router;
