const express = require("express");
const quoteParametersController = require("./quoteParameters.controller");

const router = express.Router();

router.get("/options", quoteParametersController.getQuoteParameterOptions);

module.exports = router;
