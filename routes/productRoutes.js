const express = require("express");
const router = express.Router();

const {
  getProducts,
  getItems,
  createProduct,
  updateProduct,
  addItem,
  deleteProduct,
} = require("../controllers/productController");

router.get("/", getProducts);
router.get("/items", getItems);
router.post("/", createProduct);
router.put("/", updateProduct);
router.put("/add", addItem);
router.delete("/:id", deleteProduct);

module.exports = router;
