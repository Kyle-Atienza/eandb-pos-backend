const asyncHandler = require("express-async-handler");
const Invoice = require("../models/invoiceModel");
const Product = require("../models/productModel");
const mongoose = require("mongoose");

const invoiceMatchByDateRange = ({ date_min, date_max }) => {
  const startOfDay = new Date(new Date().setUTCHours(0, 0, 0, 0));

  const aggregation = {
    $match: {
      createdAt: {
        $gte: startOfDay,
      },
    },
  };

  if (date_min) {
    aggregation.$match.createdAt.$gte = new Date(date_min);
  }
  if (date_max) {
    aggregation.$match.createdAt.$lte = new Date(date_max);
  }
  return aggregation;
};
const invoiceAggregateByBrand = [
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
];

const findBestSellerProduct = async (invoices) => {
  const invoiceItems = invoices.length
    ? invoices?.map((invoice) => invoice.items).flat()
    : [];

  let bestSellerProduct = {};
  if (invoiceItems.length) {
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
    const product = await Product.aggregate([
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
          totalSold: groupedInvoiceByItems[longestKey].reduce(
            (total, invoice) => {
              total += invoice.quantity;
              return total;
            },
            0
          ),
          totalProductSales: {
            $multiply: ["$variant.amount", totalProductQuantity],
          },
        },
      },
    ]);

    bestSellerProduct = product[0];
  }

  return bestSellerProduct;
};
const getTotalSales = (invoices) => {
  return invoices?.reduce((total, invoice) => {
    total += invoice.total;
    return total;
  }, 0);
};

const getInvoiceAnalytics = asyncHandler(async (req, res) => {
  try {
    const invoices = await Invoice.aggregate([
      invoiceMatchByDateRange(req.query),
    ]);

    res.json({
      totalSales: getTotalSales(invoices),
      totalTransactions: invoices?.length,
      bestSellerProduct: await findBestSellerProduct(invoices),
      groupedInvoiceByBrand: await Invoice.aggregate([
        invoiceMatchByDateRange(req.query),
        ...invoiceAggregateByBrand,
      ]),
    });
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

/* const getInvoiceAnalytics = asyncHandler(async (req, res) => {
  const { date_min, date_max } = req.query;

  const startOfDay = new Date(new Date().setUTCHours(0, 0, 0, 0));

  try {
    const aggregation = [
      {
        $match: {
          createdAt: {
            $gte: new Date(-1),
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
    const invoiceItems = invoices.length
      ? invoices?.map((invoice) => invoice.items).flat()
      : [];

    // Total Sales
    const totalSales = invoices?.reduce((total, invoice) => {
      total += invoice.total;
      return total;
    }, 0);

    // Total Transactions
    const totalTransactions = invoices?.length;

    // Best Seller
    let bestSellerProduct = {};
    if (invoiceItems.length) {
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
      const product = await Product.aggregate([
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
            totalSold: groupedInvoiceByItems[longestKey].reduce(
              (total, invoice) => {
                total += invoice.quantity;
                return total;
              },
              0
            ),
            totalProductSales: {
              $multiply: ["$variant.amount", totalProductQuantity],
            },
          },
        },
      ]);

      bestSellerProduct = product[0];
    }

    // Sales Per Brand
    const groupedInvoiceByBrand = await Invoice.aggregate([
      aggregation[0],
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

    res.json({
      totalSales,
      totalTransactions,
      bestSellerProduct,
      groupedInvoiceByBrand,
    });
  } catch (error) {
    res.status(500).json({ error: error });
  }
}); */

module.exports = {
  getInvoiceAnalytics,
};
