const express = require("express");
const router = express.Router();

const {
  getInvoiceAnalytics,
} = require("../controllers/analyticsController.js");

router.get("/invoices", getInvoiceAnalytics);

module.exports = router;
