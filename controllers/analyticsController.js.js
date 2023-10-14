/* const data = {
  totalSales: 12,
  totalTransactions: 12,
  bestSeller: {
    product: {
      name: "",
      image: "",
      totalSold: "",
      variant: "",
      modifier: "",
    },
  },
  salesPerBrand: {
    "E and B Farm": 12,
    NutriPage: 12,
    ThreeK: 12,
  },
}; */

const asyncHandler = require("express-async-handler");
const Invoice = require("../models/invoiceModel");

const getInvoiceAnalytics = asyncHandler(async (req, res) => {
  const { date_min, date_max } = req.query;

  try {
    const aggregation = [
      {
        $match: {
          createdAt: {
            $gte: new Date(0),
            $lte: new Date(),
          },
        },
      },
    ];

    if (date_min) {
      aggregation[1].$match.createdAt.$gte = new Date(date_min);
    }
    if (date_max) {
      aggregation[1].$match.createdAt.$lte = new Date(date_max);
    }

    const invoices = await Invoice.aggregate(aggregation);

    res.json({
      data: {},
    });
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

module.exports = {
  getInvoiceAnalytics,
};
