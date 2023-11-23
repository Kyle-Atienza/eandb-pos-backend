const asyncHandler = require("express-async-handler");

const Product = require("../models/productModel");
const ProductVariant = require("../models/productVariantModel");
const {
  getProductCode,
  mapProductVariants,
} = require("../helpers/productHelper");
const mongoose = require("mongoose");

const getProducts = asyncHandler(async (req, res) => {
  const { name } = req.query;
  const brands = req.query.brands ? req.query.brands.split(", ") : undefined;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const count = await Product.countDocuments();
    const totalPages = Math.ceil(count / limit);
    const skip = (page - 1) * limit;

    let aggregation = [
      {
        $addFields: {
          commonBrands: {
            $size: { $setIntersection: [["$brand"], brands || []] },
          },
        },
      },
      {
        $match: {
          commonBrands: {
            $gte: brands ? 1 : 0,
          },
          name: { $regex: name || "", $options: "i" },
          isDeleted: false,
        },
      },
      { $skip: skip },
      { $limit: limit },
    ];

    const data = await Product.aggregate(aggregation);

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

const getItems = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";
  const brand = req.query.brand || [""];

  const brandRegex =
    brand.length > 0 ? brand.map((b) => new RegExp(b, "i")) : [];

  try {
    const count = await ProductVariant.countDocuments({
      name: { $regex: search, $options: "i" },
      brand: { $in: brandRegex },
    });
    const totalPages = Math.ceil(count / limit);
    const skip = (page - 1) * limit;

    const data = await ProductVariant.find({
      name: { $regex: search, $options: "i" },
      brand: { $in: brandRegex },
    })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "product",
        select: "_id name code brand",
      });
    res.json({
      page,
      totalPages,
      count,
      data,
    });
  } catch (error) {
    res.status(500).json({ error: error });
    throw new Error(error);
  }
});

const createProduct = asyncHandler(async (req, res) => {
  try {
    /* const productData = {
      ...req.body,
      _id: new mongoose.Types.ObjectId(),
    };

    const productVariants = await ProductVariant.create(
      mapProductVariants(productData)
    ); */

    const product = await Product.create(req.body);

    /* await product.populate({
      path: "items",
      populate: {
        path: "product",
      },
    }); */

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error });
    throw new Error(error);
  }
});

const updateProduct = asyncHandler(async (req, res) => {
  const { id: productId, variant: variantToUpdate } = req.query;

  const updateData = req.body;
  const { variants, modifiers } = req.body;

  try {
    const product = await Product.findByIdAndUpdate(productId, req.body, {
      new: true,
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Server error", message: "Cannot update product" });
  }
});

const addItem = asyncHandler(async (req, res) => {
  const { id: productId, variant: variantToUpdate } = req.query;

  try {
    let product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    product = await Product.updateOne(
      {
        _id: product._id,
      },
      {
        $set: {
          variants: [...product.variants, req.body],
        },
      }
    );

    res.status(200).json(product);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Server error", message: "Cannot update product" });
  }
});

const updateProductImage = asyncHandler(async (req, res) => {
  try {
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Server error", message: "Cannot update product image" });
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
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = {
  getProducts,
  getItems,
  createProduct,
  updateProduct,
  updateProductImage,
  deleteProduct,
  addItem,
};
