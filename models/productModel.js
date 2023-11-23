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
      required: false,
    },
    brand: {
      type: String,
      enum: Object.values(brandEnum),
      required: true,
    },
    isDeleted: {
      type: Boolean,
      required: true,
      default: false,
    },
    variants: [
      {
        image: {
          type: String,
          required: false,
        },
        name: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        isDeleted: {
          type: Boolean,
          required: true,
        },
      },
    ],
    modifier: {
      name: {
        type: String,
        required: false,
      },
      values: {
        type: [String],
        required: false,
      },
    },
  },
  {
    timestamps: true,
    strict: "throw",
  }
);

module.exports = mongoose.model("product", productSchema);
