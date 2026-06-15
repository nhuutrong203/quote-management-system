const mongoose = require("mongoose");
const quoteService = require("./quote.service");

const REQUIRED_CLIENT_FIELDS = [
  "companyName",
  "companyAddress",
  "contactPerson",
  "phoneNumber",
  "email",
  "billingAddress",
  "deliveryAddress",
];

const validateClientDetails = (clientDetails = {}) =>
  REQUIRED_CLIENT_FIELDS.filter((field) => !String(clientDetails[field] || "").trim());

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
    const { quoteNumber, customerId, totalPlaceholder, clientDetails } = req.body;
    const createdBy = req.user?.id;

    if (!req.user || req.user.role !== "Sales") {
      return res.status(403).json({
        status: "FAILED",
        message: "Only Sales can create quotes",
      });
    }

    if (!quoteNumber || !customerId || !createdBy) {
      return res.status(400).json({
        status: "FAILED",
        message: "quoteNumber, customerId, and createdBy are required",
      });
    }

    if (!mongoose.isValidObjectId(customerId) || !mongoose.isValidObjectId(createdBy)) {
      return res.status(400).json({
        status: "FAILED",
        message: "customerId and createdBy must be valid ObjectId values",
      });
    }

    if (totalPlaceholder !== undefined && typeof totalPlaceholder !== "number") {
      return res.status(400).json({
        status: "FAILED",
        message: "totalPlaceholder must be a number",
      });
    }

    const missingClientFields = validateClientDetails(clientDetails);

    if (missingClientFields.length > 0) {
      return res.status(400).json({
        status: "FAILED",
        message: `Missing required client details: ${missingClientFields.join(", ")}`,
      });
    }

    const quote = await quoteService.createQuote({
      ...req.body,
      createdBy,
    });

    res.status(201).json({
      status: "OK",
      message: "Quote created successfully",
      data: quote,
    });
  } catch (error) {
    next(error);
  }
};

const updateQuote = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        status: "FAILED",
        message: "Invalid quote id",
      });
    }

    const { customerId, totalPlaceholder, clientDetails } = req.body;
    const updatedBy = req.user?.id;

    if (!req.user || req.user.role !== "Sales") {
      return res.status(403).json({
        status: "FAILED",
        message: "Only Sales can edit quotes",
      });
    }

    if (customerId && !mongoose.isValidObjectId(customerId)) {
      return res.status(400).json({
        status: "FAILED",
        message: "customerId must be a valid ObjectId value",
      });
    }

    if (updatedBy && !mongoose.isValidObjectId(updatedBy)) {
      return res.status(400).json({
        status: "FAILED",
        message: "updatedBy must be a valid ObjectId value",
      });
    }

    if (totalPlaceholder !== undefined && typeof totalPlaceholder !== "number") {
      return res.status(400).json({
        status: "FAILED",
        message: "totalPlaceholder must be a number",
      });
    }

    if (clientDetails) {
      const missingClientFields = validateClientDetails(clientDetails);

      if (missingClientFields.length > 0) {
        return res.status(400).json({
          status: "FAILED",
          message: `Missing required client details: ${missingClientFields.join(", ")}`,
        });
      }
    }

    const quote = await quoteService.updateQuote(req.params.id, {
      ...req.body,
      updatedBy,
    });

    if (!quote) {
      return res.status(404).json({
        status: "FAILED",
        message: "Quote not found",
      });
    }

    res.status(200).json({
      status: "OK",
      message: "Quote updated successfully",
      data: quote,
    });
  } catch (error) {
    next(error);
  }
};

const patchQuoteStatus = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        status: "FAILED",
        message: "Invalid quote id",
      });
    }

    const { action, note } = req.body;

    if (!req.user || !req.user.id || !req.user.role) {
      return res.status(401).json({
        status: "FAILED",
        message: "Authenticated user context is required",
      });
    }

    if (!action) {
      return res.status(400).json({
        status: "FAILED",
        message: "action is required",
      });
    }

    if (String(action).trim().toLowerCase().replace(/\s+/g, "_") === "send_back" && !String(note || "").trim()) {
      return res.status(400).json({
        status: "FAILED",
        message: "note is required when sending a quote back",
      });
    }

    const quote = await quoteService.updateQuoteStatus(req.params.id, {
      action,
      note,
      actor: req.user,
    });

    if (!quote) {
      return res.status(404).json({
        status: "FAILED",
        message: "Quote not found",
      });
    }

    res.status(200).json({
      status: "OK",
      message: "Quote status updated successfully",
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
  updateQuote,
  patchQuoteStatus,
};
