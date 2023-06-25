const mongoose = require("mongoose");

const productVariantSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
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
    required: true,
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
});

module.exports = mongoose.model("product_variant", productVariantSchema);
