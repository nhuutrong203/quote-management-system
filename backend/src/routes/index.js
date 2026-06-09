const express = require("express");

const healthRoutes = require("../system/health.routes");
const customerRoutes = require("../modules/customers/customer.routes");
const quoteRoutes = require("../modules/quotes/quote.routes");
const orderRoutes = require("../modules/orders/order.routes");
const quoteSetupRoutes = require("../modules/quoteSetup/quoteSetup.routes");
const userRoutes = require("../modules/users/user.routes");

const router = express.Router();

router.use("/health", healthRoutes);
router.use("/customers", customerRoutes);
router.use("/quotes", quoteRoutes);
router.use("/orders", orderRoutes);
router.use("/quote-setup", quoteSetupRoutes);
router.use("/users", userRoutes);

module.exports = router;
