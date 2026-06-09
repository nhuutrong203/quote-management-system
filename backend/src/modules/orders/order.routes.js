const express = require("express");
const orderController = require("./order.controller");

const router = express.Router();

router.get("/form", orderController.getOrderForm);

module.exports = router;