const asyncHandler = require("express-async-handler");
const Invoice = require("../models/invoiceModel");
const Excel = require("exceljs");
const { mailTransporter } = require("../helpers/mailHelper");
const {
  unwindAndReplaceRoot,
  groupAndProject,
  lookupAndUnwind,
  filterByBrand,
  addFieldsAndSet,
  cleanupAndSort,
} = require("../helpers/reportHelpers/salesAggregation");

const sender = process.env.NODEMAILER_USER;

const invoiceMatchByDateRange = (date_min, date_max) => {
  const aggregation = {
    $match: {
      createdAt: {
        $gte: new Date(-1),
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
  const {
    recipient,
    date_min,
    date_max,
    brands = "",
    product,
    grouped = true,
  } = req.query;
  const invoiceReportPath = `./reports/invoice/manual/${getWorkbookDateTitle()}.xlsx`;

  try {
    let emailContent = "";
    let invoices = [];
    let columns = [];

    invoices = await Invoice.aggregate([
      invoiceMatchByDateRange(date_min, date_max),
      ...unwindAndReplaceRoot,
      ...groupAndProject,
      ...lookupAndUnwind,
      ...filterByBrand(brands.split(",")),
      ...addFieldsAndSet,
      ...cleanupAndSort,
    ]);

    if (invoices.length) {
      const invoice = invoices[0];
      delete invoice._id;
      columns = Object.keys(invoices[0]).map((key) => ({
        name: key,
        type: typeof invoices[0][key],
      }));
    }

    // code to generate excel file
    /* const workbook = new Excel.Workbook();
    createWorksheet("Invoices", workbook, invoices);
    await workbook.xlsx.writeFile(invoiceReportPath); */

    res.json({ rows: invoices, columns });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }
});

const emailInvoiceReport = asyncHandler(async (req, res) => {
  const { recipient, date_min, date_max } = req.query;
  const invoiceReportPath = `./reports/invoice/manual/${getWorkbookDateTitle()}.xlsx`;

  let emailContent = "";
  let invoices = [];

  try {
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

    res.json({ message: `Your Report has been sent to: ${recipient}` });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }
});

module.exports = {
  getInvoiceReport,
  emailInvoiceReport,
};
