const express = require("express");
const quoteSetupController = require("./quoteSetup.controller");

const router = express.Router();

router.get("/", quoteSetupController.getQuoteSetup);
router.get("/parameters", quoteSetupController.getParameterOptions);

module.exports = router;