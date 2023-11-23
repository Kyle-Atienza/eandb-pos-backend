const express = require("express");
const router = express.Router();

const {
  getInvoiceReport,
  emailInvoiceReport,
} = require("../controllers/reportController.js");

router.get("/invoice", getInvoiceReport);
router.get("/invoice/email", emailInvoiceReport);

module.exports = router;
