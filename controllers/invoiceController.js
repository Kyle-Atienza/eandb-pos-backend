const asyncHandler = require("express-async-handler");
const Invoice = require("../models/invoiceModel");
const Product = require("../models/productModel");
const ProductVariant = require("../models/productVariantModel");

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
    const products = await Product.find();
    let invoice = await Invoice.findById(invoiceId);

    const getVariant = (itemCode) => {
      const [productId, variantId, modiferValue] = itemCode
        .replaceAll("-", " ")
        .split("_");

      const product = products?.find((product) => {
        return product.id === productId;
      });

      const item = product.variants.find((variant) => variant.id === variantId);

      if (modiferValue) {
        return {
          name: product.name,
          variant: item._doc,
          modifier: {
            name: product.modifier?.name,
            value: modiferValue,
          },
        };
      } else {
        return {
          name: product.name,
          variant: item._doc,
        };
      }
    };

    const items = invoice.items.map((item) => {
      return {
        ...item._doc,
        ...getVariant(item.item),
      };
    });

    res.status(200).json({ ...invoice._doc, items });
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
    throw new Error(error);
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
    res.status(500).json({ error: "Server error" });
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
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
};
