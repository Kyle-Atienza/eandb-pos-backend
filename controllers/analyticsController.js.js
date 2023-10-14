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
const Product = require("../models/productModel");
const mongoose = require("mongoose");

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
    const invoiceItems = invoices.map((invoice) => invoice.items).flat();

    // Total Sales
    const totalSales = invoices.reduce((total, invoice) => {
      total += invoice.total;
      return total;
    }, 0);

    // Total Transactions
    const totalTransactions = invoices.length;

    // Best Seller
    const groupedInvoiceByItems = invoiceItems.reduce((grouped, item) => {
      const key = item.item;

      if (!grouped[key]) {
        grouped[key] = [];
      }

      grouped[key].push(item);

      return grouped;
    }, {});

    let longestKey = null;
    let maxLength = 0;
    for (const key in groupedInvoiceByItems) {
      if (groupedInvoiceByItems[key].length > maxLength) {
        longestKey = key;
        maxLength = groupedInvoiceByItems[key].length;
      }
    }
    const totalProductQuantity = groupedInvoiceByItems[longestKey].reduce(
      (totalQuantity, product) => {
        totalQuantity += product.quantity;
        return totalQuantity;
      },
      0
    );

    const [productId, variantId, modifier] = longestKey.split("_");
    const bestSellerProduct = await Product.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(productId),
        },
      },
      {
        $project: {
          name: "$name",
          variant: {
            $let: {
              vars: {
                filterVariant: {
                  $filter: {
                    input: "$variants",
                    as: "variant",
                    cond: {
                      $cmp: ["$$variant._id", variantId],
                    },
                  },
                },
              },
              in: { $arrayElemAt: ["$$filterVariant", 0] },
            },
          },
        },
      },
      {
        $addFields: {
          totalSold: groupedInvoiceByItems[longestKey].length,
          totalProductSales: {
            $multiply: ["$variant.amount", totalProductQuantity],
          },
        },
      },
    ]);

    // Sales Per Brand
    const groupedInvoiceByBrand = await Invoice.aggregate([
      { $unwind: "$items" },
      {
        $addFields: {
          productId: {
            $let: {
              vars: {
                ids: {
                  $split: ["$items.item", "_"],
                },
              },
              in: { $toObjectId: { $arrayElemAt: ["$$ids", 0] } },
            },
          },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $project: {
          brand: {
            $let: {
              vars: {
                product: {
                  $arrayElemAt: ["$product", 0],
                },
              },
              in: "$$product.brand",
            },
          },
        },
      },
      {
        $group: {
          _id: "$brand",
          count: { $count: {} },
        },
      },
    ]);

    // console.log(groupedInvoiceByBrand);

    res.json({
      totalSales,
      totalTransactions,
      bestSellerProduct: bestSellerProduct[0],
      groupedInvoiceByBrand,
    });
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

module.exports = {
  getInvoiceAnalytics,
};
