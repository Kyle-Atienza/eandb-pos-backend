const express = require("express");
const router = express.Router();

const {
  getProducts,
  getItems,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

router.get("/", getProducts);
router.get("/items", getItems);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.put("/", updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;
