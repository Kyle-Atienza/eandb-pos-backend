const mongoose = require("mongoose");

const PaymentMethodEnum = Object.freeze({
  CASH: "cash",
  GCASH: "GCash",
  BANK: "bank",
});

const itemsTemp = {
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      variant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductVariant",
        required: true,
      },
      modifier: [
        {
          name: {
            type: String,
            required: true,
          },
          value: {
            type: String,
            required: true,
          },
        },
      ],
      quantity: {
        type: Number,
        required: true,
      },
    },
  ],
};

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
          default: true,
        },
        ref: {
          product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
          },
          variant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProductVariant",
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
        name: {
          type: String,
          required: true,
        },
        brand: {
          type: String,
          required: true,
        },
        variant: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
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

module.exports = mongoose.model("Invoice", invoiceSchema);
