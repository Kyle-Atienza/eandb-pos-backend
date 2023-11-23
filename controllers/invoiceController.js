const asyncHandler = require("express-async-handler");
const Invoice = require("../models/invoiceModel");
const Product = require("../models/productModel");

const getInvoices = asyncHandler(async (req, res) => {
  const {
    page,
    buyer,
    total_min,
    total_max,
    items_min,
    items_max,
    date_min,
    date_max,
  } = req.query;

  try {
    let limit = parseInt(req.query.limit);
    if (limit) {
      if (limit === -1) {
        limit = 0;
      }
    } else {
      limit = 10;
    }
    const skip = !limit ? 1 : ((parseInt(page) || 1) - 1) * limit;

    const aggregation = [
      {
        $addFields: {
          itemsSize: { $size: "$items" },
        },
      },
      {
        $match: {
          buyer: { $regex: buyer || "", $options: "i" },
          total: { $gte: parseInt(total_min) || 1 },
          itemsSize: { $gte: parseInt(items_min) || 1 },
          createdAt: {
            $gte: new Date(0),
            $lte: new Date(),
          },
        },
      },
      { $skip: skip },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ];

    if (parseInt(total_max)) {
      aggregation[1].$match.total.$lte = parseInt(total_max);
    }
    if (parseInt(items_max)) {
      aggregation[1].$match.itemsSize.$lte = parseInt(items_max);
    }
    if (date_min) {
      aggregation[1].$match.createdAt.$gte = new Date(date_min);
    }
    if (date_max) {
      aggregation[1].$match.createdAt.$lte = new Date(date_max);
    }
    if (limit) {
      aggregation.push({
        $limit: limit,
      });
    }

    const invoices = await Invoice.aggregate(aggregation);

    res.json({
      page,
      totalPages: Math.ceil(invoices.length / limit),
      count: invoices.length,
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
          modifier: modiferValue,
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
