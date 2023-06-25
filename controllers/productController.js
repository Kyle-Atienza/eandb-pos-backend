const asyncHandler = require("express-async-handler");

const Product = require("../models/productModel");
const ProductVariant = require("../models/productVariantModel");
const {
  getProductCode,
  mapProductVariants,
} = require("../helpers/productHelper");
const mongoose = require("mongoose");

/* const getProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const count = await Product.countDocuments();
    const totalPages = Math.ceil(count / limit);
    const skip = (page - 1) * limit;

    const data = await Product.find()
      .skip(skip)
      .limit(limit)
      .populate({
        path: "variants",
        populate: {
          path: "product",
        },
      });

    res.json({
      page,
      totalPages,
      count,
      data,
    });
  } catch (error) {
    res.status(500).json({ error: error });
  }
}); */

/* const getProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || "";

  try {
    const count = await Product.countDocuments({
      "product.name": { $regex: search, $options: "i" },
    });
    const totalPages = Math.ceil(count / limit);
    const skip = (page - 1) * limit;

    const data = await Product.find({
      "product.name": { $regex: search, $options: "i" },
    })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "variants",
        populate: {
          path: "product",
        },
      });

    res.json({
      page,
      totalPages,
      count,
      data,
    });
  } catch (error) {
    res.status(500).json({ error: error });
  }
}); */

/* const getProducts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const countPipeline = [
      {
        $count: "totalDocuments",
      },
    ];
    const [{ totalDocuments: count }] = await Product.aggregate(countPipeline);

    const totalPages = Math.ceil(count / limit);
    const skip = (page - 1) * limit;

    const dataPipeline = [
      {
        $skip: skip,
      },
      {
        $limit: limit,
      },
      {
        $lookup: {
          from: "variants",
          localField: "variants",
          foreignField: "_id",
          as: "variants",
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "variants.product",
          foreignField: "_id",
          as: "variants.product",
        },
      },
      {
        $unwind: "$variants.product",
      },
    ];
    const data = await Product.aggregate(dataPipeline);

    res.json({
      page,
      totalPages,
      count,
      data,
    });
  } catch (error) {
    res.status(500).json({ error: error });
  }
}); */

/* const getItems = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const count = await ProductVariant.countDocuments();
    const totalPages = Math.ceil(count / limit);
    const skip = (page - 1) * limit;

    const data = await ProductVariant.find()
      .skip(skip)
      .limit(limit)
      .populate("product");

    res.json({
      page,
      totalPages,
      count,
      data,
    });
  } catch (error) {
    res.status(500).json({ error: error });
  }
}); */

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
      .populate({
        path: "variants",
        populate: {
          path: "product",
        },
      });

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
    const productData = {
      ...req.body,
      _id: new mongoose.Types.ObjectId(),
    };

    const productVariants = await ProductVariant.create(
      mapProductVariants(productData)
    );

    const product = await Product.create({
      ...productData,
      variants: productVariants.map((variant) => variant._id),
    });

    await product.populate({
      path: "variants",
      populate: {
        path: "product",
      },
    });

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ error: error });
    throw new Error(error);
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
  getItems,
  createProduct,
  updateProduct,
  deleteProduct,
};
