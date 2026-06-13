const express = require("express");
const orderController = require("./order.controller");

const router = express.Router();

router.get("/", orderController.getOrders);
router.get("/form", orderController.getOrderForm);
router.get("/form/:quoteId", orderController.getOrderForm);

module.exports = router;
