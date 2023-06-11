const asyncHandler = require("express-async-handler");

const Product = require("../models/productModel");
const ProductVariant = require("../models/productVariantModel");

const getProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const count = await Product.countDocuments();
    const totalPages = Math.ceil(count / limit);
    const skip = (page - 1) * limit;

    const data = await Product.find()
      .skip(skip)
      .limit(limit)
      .populate("variants");

    res.json({
      page,
      totalPages,
      count,
      data,
    });
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

const createProduct = asyncHandler(async (req, res) => {
  try {
    const variants = await ProductVariant.create(req.body.variants);
    const product = await Product.create({
      ...req.body,
      variants: variants.map((variant) => variant.id),
    });
    await product.populate("variants");

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error });
  }
});

const updateProduct = asyncHandler(async (req, res) => {
  const productId = req.params.id;
  const updateData = req.body;

  try {
    const product = await Product.findByIdAndUpdate(productId, updateData, {
      new: true,
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

const deleteProduct = asyncHandler(async (req, res) => {
  const productId = req.params.id;

  try {
    const product = await Product.findByIdAndRemove(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
