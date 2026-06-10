const mongoose = require("mongoose");
const quoteService = require("./quote.service");

const getQuotes = async (req, res, next) => {
  try {
    const quotes = await quoteService.getQuotes();

    res.status(200).json({
      status: "OK",
      message: "Quotes fetched successfully",
      data: quotes,
    });
  } catch (error) {
    next(error);
  }
};

const getQuoteById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        status: "FAILED",
        message: "Invalid quote id",
      });
    }

    const quote = await quoteService.getQuoteById(req.params.id);

    if (!quote) {
      return res.status(404).json({
        status: "FAILED",
        message: "Quote not found",
      });
    }

    res.status(200).json({
      status: "OK",
      message: "Quote fetched successfully",
      data: quote,
    });
  } catch (error) {
    next(error);
  }
};

const createQuote = async (req, res, next) => {
  try {
    const { quoteNumber, customerId, createdBy, totalPlaceholder } = req.body;

    if (!quoteNumber || !customerId || !createdBy) {
      return res.status(400).json({
        status: "FAILED",
        message: "quoteNumber, customerId, and createdBy are required",
      });
    }

    if (
      !mongoose.isValidObjectId(customerId) ||
      !mongoose.isValidObjectId(createdBy)
    ) {
      return res.status(400).json({
        status: "FAILED",
        message: "customerId and createdBy must be valid ObjectId values",
      });
    }

    if (
      totalPlaceholder !== undefined &&
      typeof totalPlaceholder !== "number"
    ) {
      return res.status(400).json({
        status: "FAILED",
        message: "totalPlaceholder must be a number",
      });
    }

    const quote = await quoteService.createQuote(req.body);

    res.status(201).json({
      status: "OK",
      message: "Quote created successfully",
      data: quote,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQuotes,
  getQuoteById,
  createQuote,
};