const asyncHandler = require("express-async-handler");
const Invoice = require("../models/invoiceModel");
const Excel = require("exceljs");
const { mailTransporter } = require("../helpers/mailHelper");

const sender = process.env.NODEMAILER_USER;

const invoiceAggregation = [
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
];
const invoiceWokrsheetColumns = [
  {
    header: "Product",
    key: "product",
    width: 30,
  },
  {
    header: "Variant",
    key: "variant",
    width: 30,
  },
  {
    header: "Modifier",
    key: "modifier",
    width: 30,
  },
  {
    header: "Sales",
    key: "sales",
    width: 20,
  },
  {
    header: "Sold",
    key: "sold",
    width: 20,
  },
];

const createWorksheet = (name, workbook, rows) => {
  const testWorksheet = workbook.addWorksheet(name);
  testWorksheet.columns = invoiceWokrsheetColumns;

  rows.forEach((rowData, index) => {
    const row = testWorksheet.getRow(index + 2);
    row.values = rowData;
  });
};

const getInvoiceReport = asyncHandler(async (req, res) => {
  const { recipient } = req.query;
  const invoiceReportPath = "./reports/invoice/test.xlsx";

  try {
    if (recipient) {
      const invoices = await Invoice.aggregate(invoiceAggregation);

      const workbook = new Excel.Workbook();
      createWorksheet("Invoices", workbook, invoices);
      await workbook.xlsx.writeFile(invoiceReportPath);
      const buffer = await workbook.xlsx.writeBuffer();

      await mailTransporter.sendMail({
        from: sender,
        to: recipient,
        subject: "Invoice Report",
        text: "Here is the invoice report",
        attachments: [
          {
            filename: invoiceReportPath,
            content: buffer,
          },
        ],
      });
    } else {
      throw new Error("Email recipient is not provided");
    }
    res.json({ message: "Your Report has been sent to " + recipient });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }
});

/* const getInvoiceReport = asyncHandler(async (req, res) => {
  console.log("this");
  const { recipient } = req.query;

  try {
    if (recipient) {
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
        to: recipient, // list of receivers
        subject: "Subject",
        text: "Report Send Test",
        attachments: [
          {
            filename: "./test.xlsx",
            content: buffer,
          },
        ],
      });
    } else {
      throw new Error("Email recipient is not provided");
    }
    res.json({ message: "Your Report has been sent to " + recipient });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }
}); */

module.exports = {
  getInvoiceReport,
};
