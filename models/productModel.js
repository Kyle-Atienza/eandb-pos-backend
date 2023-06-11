const mongoose = require("mongoose");

const BrandEnum = Object.freeze({
  EANDBFARM: "E and B Farm",
  THREEK: "Three K",
  NUTRIPAGE: "NutriPage",
});

const productSchema = new mongoose.Schema(
  {
    name: {
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
        ref: "ProductVariant",
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
    timestamps: true,
    strict: "throw",
  }
);

module.exports = mongoose.model("Product", productSchema);
