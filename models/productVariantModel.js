const mongoose = require("mongoose");

const productVariantSchema = new mongoose.Schema({
  sku: {
    type: String,
  },
  name: {
    type: String,
    required: true,
  },
  variant: {
    type: String,
    required: true,
  },
  brand: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
  },
  modifier: {
    type: {
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
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "product",
    required: true,
  },
  isDeleted: {
    type: Boolean,
    required: true,
    default: false,
  },
});

module.exports = mongoose.model("product_variant", productVariantSchema);
