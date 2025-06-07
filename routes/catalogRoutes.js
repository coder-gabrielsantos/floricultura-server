const express = require("express");
const router = express.Router();
const catalogController = require("../controllers/catalogController");
const { verifyToken, requireAdmin } = require("../middleware/authMiddleware");

/**
 * Catalog routes
 * Admin-only: create, update, delete
 * Public: list and get by ID
 */
router.post("/", verifyToken, requireAdmin, catalogController.createCatalog);
router.put("/:id", verifyToken, requireAdmin, catalogController.updateCatalog);
router.delete("/:id", verifyToken, requireAdmin, catalogController.deleteCatalog);

router.get("/", catalogController.getCatalogs);
router.get("/:id", catalogController.getCatalogById);

module.exports = router;
