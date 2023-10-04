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
        item: {
          type: String,
          required: true,
        },
        variant: {
          type: mongoose.Types.ObjectId,
          required: false,
        },
        quantity: {
          type: Number,
          required: true,
        },
      },
    ],
    total: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
    strict: "throw",
  }
);

module.exports = mongoose.model("invoice", invoiceSchema);
