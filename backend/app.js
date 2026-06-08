const express = require("express");
const cors = require("cors");

const apiRoutes = require("./src/routes");
const errorMiddleware = require("./src/middlewares/error.middleware");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    status: "OKAY",
    message: "Quote Management Backend API is running",
  });
});

app.use("/api", apiRoutes);

app.use(errorMiddleware);

module.exports = app;
