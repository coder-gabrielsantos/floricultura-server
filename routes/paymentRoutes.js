const express = require("express");
const router = express.Router();
const { createPreference } = require("../controllers/paymentController");

/**
 * Payment route (used to create Mercado Pago preference)
 */
router.post("/create-preference", createPreference);

module.exports = router;
