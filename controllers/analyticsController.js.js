const asyncHandler = require("express-async-handler");
const Invoice = require("../models/invoiceModel");
const Product = require("../models/productModel");
const mongoose = require("mongoose");

const { transformToCSVFormat } = require("../helpers/analyticsHelpers");
const Excel = require("exceljs");

const { mailTransporter } = require("../helpers/mailHelper");

const getInvoiceAnalytics = asyncHandler(async (req, res) => {
  const { date_min, date_max } = req.query;

  try {
    const aggregation = [
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().setUTCHours(0, 0, 0, 0)),
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
});

const getInvoiceReport = asyncHandler(async (req, res) => {
  try {
    const invoices = await Invoice.aggregate([
      { $unwind: "$items" },
      {
        $replaceRoot: {
          newRoot: "$items",
        },
      },
      {
        $group: {
          _id: "$item",
          count: { $count: {} },
        },
      },
      {
        $project: {
          productId: {
            $let: {
              vars: {
                id: {
                  $split: ["$_id", "_"],
                },
              },
              in: { $toObjectId: { $arrayElemAt: ["$$id", 0] } },
            },
          },
          variantId: {
            $let: {
              vars: {
                id: {
                  $split: ["$_id", "_"],
                },
              },
              in: { $toObjectId: { $arrayElemAt: ["$$id", 1] } },
            },
          },
          modifier: {
            $let: {
              vars: {
                id: {
                  $split: ["$_id", "_"],
                },
              },
              in: { $arrayElemAt: ["$$id", 2] },
            },
          },
          count: "$count",
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
        $unwind: "$product",
      },
      {
        $addFields: {
          variant: {
            $let: {
              vars: {
                index: {
                  $indexOfArray: ["$product.variants._id", "$variantId"],
                },
              },
              in: {
                $arrayElemAt: ["$product.variants", "$$index"],
              },
            },
          },
          sales: "$variant.amount",
        },
      },
      {
        $set: {
          sold: "$count",
          variant: "$variant.name",
          product: "$product.name",
          sales: {
            $multiply: ["$variant.amount", "$count"],
          },
        },
      },
      {
        $fill: {
          output: {
            modifier: {
              value: "",
            },
          },
        },
      },
      {
        $unset: [
          "count",
          "productId",
          "variantId",
          "product.variants",
          "product.modifier",
        ],
      },
      {
        $sort: {
          product: -1,
        },
      },
    ]);

    console.log(
      Object.keys(invoices[0]).map((key) => ({
        header: key,
        key,
        width: 10,
      }))
    );

    const workbook = new Excel.Workbook();
    const testWorksheet = workbook.addWorksheet("Test Worksheet");
    const columnWidth = 30;
    testWorksheet.columns = [
      {
        header: "Product",
        key: "product",
        width: columnWidth,
      },
      {
        header: "Variant",
        key: "variant",
        width: columnWidth,
      },
      {
        header: "Modifier",
        key: "modifier",
        width: columnWidth,
      },
      {
        header: "Sales",
        key: "sales",
        width: columnWidth,
      },
      {
        header: "Sold",
        key: "sold",
        width: columnWidth,
      },
    ];

    invoices.forEach((invoice, index) => {
      const row = testWorksheet.getRow(index + 2);
      row.values = invoice;
    });

    await workbook.xlsx.writeFile("./test.xlsx");
    const buffer = await workbook.xlsx.writeBuffer();

    await mailTransporter.sendMail({
      from: "eandbpos@gmail.com", // sender address
      to: "kylefrancisedison@gmail.com", // list of receivers
      subject: "Subject",
      text: "Report Send Test",
      attachments: [
        {
          filename: "./test.xlsx",
          content: buffer,
        },
      ],
    });

    res.json({ invoices });
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

module.exports = {
  getInvoiceAnalytics,
  getInvoiceReport,
};
