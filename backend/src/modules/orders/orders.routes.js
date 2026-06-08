const express = require("express");
const ordersController = require("./orders.controller");

const router = express.Router();

router.get("/form", ordersController.getOrderForm);

module.exports = router;