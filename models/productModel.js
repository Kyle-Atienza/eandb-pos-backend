const mongoose = require("mongoose");

const BrandEnum = Object.freeze({
  EANDBFARM: "E and B Farm",
  THREEK: "Three K",
  NUTRIPAGE: "NutriPage",
});

const productSchema = new mongoose.Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      enum: Object.values(BrandEnum),
      required: true,
    },
    variants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product_variant",
      },
    ],
    modifiers: [
      {
        name: {
          type: String,
          required: true,
        },
        values: {
          type: [String],
          required: true,
        },
      },
    ],
  },
  {
    _id: false,
    timestamps: true,
    strict: "throw",
  }
);

module.exports = mongoose.model("product", productSchema);
