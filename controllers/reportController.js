const asyncHandler = require("express-async-handler");
const Invoice = require("../models/invoiceModel");
const Excel = require("exceljs");
const { mailTransporter } = require("../helpers/mailHelper");

const sender = process.env.NODEMAILER_USER;

const invoiceMatchByDateRange = (date_min, date_max) => {
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
const getWorkbookDateTitle = () => {
  return (
    new Date().toLocaleDateString().replaceAll("/", "-") +
    "_" +
    new Date().toLocaleTimeString().replaceAll(" ", "_")
  );
};

const createWorksheet = (name, workbook, rows) => {
  const testWorksheet = workbook.addWorksheet(name);
  testWorksheet.columns = invoiceWokrsheetColumns;

  rows.forEach((rowData, index) => {
    const row = testWorksheet.getRow(index + 2);
    row.values = rowData;
  });
};

const getInvoiceReport = asyncHandler(async (req, res) => {
  const { recipient, date_min, date_max } = req.query;

  const invoiceReportPath = `./reports/invoice/manual/${getWorkbookDateTitle()}.xlsx`;

  try {
    let emailContent = "";
    let invoices = [];

    if (!date_min || !date_max) {
      throw new Error("Dates are not provided");
    }

    if (recipient) {
      invoices = await Invoice.aggregate([
        invoiceMatchByDateRange(date_min, date_max),
        ...invoiceAggregation,
      ]);

      const workbook = new Excel.Workbook();
      createWorksheet("Invoices", workbook, invoices);
      await workbook.xlsx.writeFile(invoiceReportPath);
      const buffer = await workbook.xlsx.writeBuffer();

      emailContent = `Here is the invoice report from ${new Date(
        date_min
      ).toDateString()} to ${new Date(date_max).toDateString()}`;

      mailTransporter.sendMail({
        from: sender,
        to: recipient,
        subject: "Manually Generated Invoice Report",
        text: emailContent,
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

module.exports = {
  getInvoiceReport,
};
