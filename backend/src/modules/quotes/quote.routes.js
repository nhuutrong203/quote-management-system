const express = require("express");
const quoteController = require("./quote.controller");

const router = express.Router();

router.get("/", quoteController.getQuotes);

module.exports = router;