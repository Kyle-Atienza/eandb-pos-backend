const express = require("express");
const router = express.Router();

const { getInvoiceReport } = require("../controllers/reportController.js");

router.get("/invoice", getInvoiceReport);

module.exports = router;
