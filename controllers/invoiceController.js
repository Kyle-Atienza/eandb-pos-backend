const asyncHandler = require("express-async-handler");
const Invoice = require("../models/invoiceModel");

const getInvoices = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const count = await Invoice.countDocuments();
    const totalPages = Math.ceil(count / limit);
    const skip = (page - 1) * limit;

    const invoices = await Invoice.find().skip(skip).limit(limit);

    res.json({
      page,
      totalPages,
      count,
      data: invoices,
    });
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

const getInvoice = asyncHandler(async (req, res) => {
  const invoiceId = req.params.id;

  try {
    const invoice = await Invoice.findById(invoiceId);

    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

const createInvoice = asyncHandler(async (req, res) => {
  try {
    const invoice = await Invoice.create(req.body);

    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

const updateInvoice = asyncHandler(async (req, res) => {
  const invoiceId = req.params.id;
  const updateData = req.body;

  try {
    const invoice = await Invoice.findByIdAndUpdate(invoiceId, updateData, {
      new: true,
    });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.status(200).json(invoice);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

const deleteInvoice = asyncHandler(async (req, res) => {
  const invoiceId = req.params.id;

  try {
    const invoice = await Invoice.findByIdAndRemove(invoiceId);

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.json({ message: "Invoice deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

module.exports = {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
};
