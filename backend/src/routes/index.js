const express = require("express");

const systemRoutes = require("../system/health.routes");
const quoteRoutes = require("../modules/quotes/quote.routes");
const quoteSetupRoutes = require("../modules/quoteSetup/quoteSetup.routes");
const ordersRoutes = require("../modules/orders/orders.routes");

const router = express.Router();

router.use("/system", systemRoutes);
router.use("/quotes", quoteRoutes);
router.use("/quote-setup", quoteSetupRoutes);
router.use("/orders", ordersRoutes);

module.exports = router;