const express = require("express");
const router = express.Router();

const {
  getInvoiceAnalytics,
  getInvoiceReport,
} = require("../controllers/analyticsController.js");

router.get("/invoice", getInvoiceAnalytics);
router.get("/invoice/csv", getInvoiceReport);

module.exports = router;
