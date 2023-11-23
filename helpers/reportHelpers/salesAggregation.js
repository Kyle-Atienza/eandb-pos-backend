// Define reusable expressions
const idSplit = {
  $let: {
    vars: {
      id: { $split: ["$_id", "_"] },
    },
    in: "$$id",
  },
};

// Pipeline stages
const unwindAndReplaceRoot = [
  { $unwind: "$items" },
  { $replaceRoot: { newRoot: "$items" } },
];

const groupAndProject = [
  {
    $group: {
      _id: "$item",
      count: { $sum: 1 }, // Count occurrences
    },
  },
  {
    $project: {
      _id: 0,
      productId: { $toObjectId: { $arrayElemAt: [idSplit, 0] } },
      variantId: { $toObjectId: { $arrayElemAt: [idSplit, 1] } },
      modifier: { $arrayElemAt: [idSplit, 2] },
      count: "$count",
    },
  },
];

const lookupAndUnwind = [
  {
    $lookup: {
      from: "products",
      localField: "productId",
      foreignField: "_id",
      as: "product",
    },
  },
  { $unwind: "$product" },
];

const filterByBrand = (brands) => {
  return [
    {
      $match: {
        "product.brand": { $in: brands },
      },
    },
  ];
};

const addFieldsAndSet = [
  {
    $addFields: {
      variant: {
        $arrayElemAt: [
          "$product.variants",
          { $indexOfArray: ["$product.variants._id", "$variantId"] },
        ],
      },
      sales: { $multiply: ["$variant.amount", "$count"] },
    },
  },
  {
    $set: {
      sold: "$count",
      variant: "$variant.name",
      product: "$product.name",
      sales: "$sales",
    },
  },
];

const cleanupAndSort = [
  {
    $unset: [
      "count",
      "productId",
      "variantId",
      "product.variants",
      "product.modifier",
    ],
  },
  { $sort: { product: -1 } },
];

// Final aggregation pipeline
module.exports = {
  unwindAndReplaceRoot,
  groupAndProject,
  lookupAndUnwind,
  filterByBrand,
  addFieldsAndSet,
  cleanupAndSort,
};
