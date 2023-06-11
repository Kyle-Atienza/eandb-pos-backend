const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const { createServer } = require("http");
const { errorHandler } = require("./middlewares/errorMiddleware");
const connectDB = require("./config/database");

require("dotenv").config();

const app = express();
const port = process.env.PORT || 4040;

connectDB()
  .then(() => {})
  .catch((e) => {
    console.log(e);
  });

app.use(
  cors({
    origin: "*",
  })
);

app.use(bodyParser.json());
app.use(errorHandler);

app.use("/products", require("./routes/productRoutes"));
app.use("/invoices", require("./routes/invoiceRoutes"));

app.listen(port, () => {
  console.log("E and B POS initiated at port " + port);
});
