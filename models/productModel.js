const mongoose = require("mongoose");
const brandEnum = require("./enums/brandEnum");

const productSchema = new mongoose.Schema(
  {
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
      enum: Object.values(brandEnum),
      required: true,
    },
    items: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product_variant",
      },
    ],
    variants: [
      {
        name: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
      },
    ],
    modifier: {
      name: {
        type: String,
        required: true,
      },
      values: {
        type: [String],
        required: true,
      },
    },
  },
  {
    timestamps: true,
    strict: "throw",
  }
);

module.exports = mongoose.model("product", productSchema);
