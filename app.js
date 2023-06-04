const express = require("express");
require("dotenv").config();
const app = express();
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");

//Swagger Documentation
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load("./swagger.yaml");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

//Morgan Middleware
app.use(morgan("tiny"));

//Cookie and File Upload Middleware
app.use(cookieParser());
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

// Routes
const home = require("./routes/home");
const user = require("./routes/user");
const product = require("./routes/product");
const payment = require("./routes/payment");
const order = require("./routes/order");

//Regular Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middlewares
app.use("/api/v1/", home);
app.use("/api/v1/", user);
app.use("/api/v1/", product);
app.use("/api/v1/", payment);
app.use("/api/v1/", order);

module.exports = app;
