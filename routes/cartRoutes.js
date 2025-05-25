const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const { verifyToken } = require("../middleware/authMiddleware");

router.get("/", verifyToken, cartController.getCart);
router.post("/add", verifyToken, cartController.addToCart);
router.put("/update", verifyToken, cartController.updateItem);
router.delete("/remove/:id", verifyToken, cartController.removeItem);
router.delete("/", verifyToken, cartController.clearCart);

module.exports = router;
