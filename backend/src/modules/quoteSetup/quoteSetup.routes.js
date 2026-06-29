const express = require("express");
const quoteSetupController = require("./quoteSetup.controller");

const router = express.Router();

router.get("/", quoteSetupController.getQuoteSetup);
router.put("/", quoteSetupController.updateQuoteSetup);

module.exports = router;