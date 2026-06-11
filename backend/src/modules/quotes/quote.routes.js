const express = require("express");
const quoteController = require("./quote.controller");

const router = express.Router();

router.get("/", quoteController.getQuotes);
router.get("/:id", quoteController.getQuoteById);
router.post("/", quoteController.createQuote);
router.put("/:id", quoteController.updateQuote);

module.exports = router;
