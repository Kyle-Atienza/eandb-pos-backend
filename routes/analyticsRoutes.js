const express = require("express");
const router = express.Router();

const {
  getInvoiceAnalytics,
} = require("../controllers/analyticsController.js");

router.get("/invoice", getInvoiceAnalytics);

module.exports = router;
