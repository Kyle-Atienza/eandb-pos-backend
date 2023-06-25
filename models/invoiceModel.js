const mongoose = require("mongoose");

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
          type: mongoose.Schema.Types.ObjectId,
          ref: "product_variant",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
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
