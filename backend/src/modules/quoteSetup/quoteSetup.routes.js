const express = require("express");
const quoteSetupController = require("./quoteSetup.controller");

const router = express.Router();

router.get("/", quoteSetupController.getQuoteSetup);

module.exports = router;