const mongoose = require("mongoose");
const brandEnum = require("./enums/brandEnum");

const PaymentMethodEnum = Object.freeze({
  CASH: "cash",
  GCASH: "GCash",
  BANK: "bank",
});

const invoiceSchema = new mongoose.Schema(
  {
    buyer: {
      type: String,
      required: true,
    },
    contactNumber: String,
    emailAddress: String,
    notes: String,
    paymentMethod: {
      type: String,
      enum: PaymentMethodEnum,
      required: true,
    },
    items: [
      {
        id: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        brand: {
          type: String,
          enum: Object.values(brandEnum),
          required: true,
        },
        variant: {
          name: {
            type: String,
            required: true,
          },
          amount: {
            type: Number,
            required: true,
          },
        },
        modifier: {
          name: {
            type: String,
            required: true,
          },
          value: {
            type: String,
            required: true,
          },
        },
      },
    ],
  },
  {
    timestamps: true,
    strict: "throw",
  }
);

module.exports = mongoose.model("invoice", invoiceSchema);
