const Quote = require("./quote.model");

const getQuotes = async () => {
  const quotes = await Quote.find()
    .populate("customerId", "companyName contactName email")
    .populate("createdBy", "name email role")
    .sort({ createdAt: -1 });

  return quotes;
};

const getQuoteById = async (quoteId) => {
  const quote = await Quote.findById(quoteId)
    .populate("customerId", "companyName contactName email")
    .populate("createdBy", "name email role");

  return quote;
};

const createQuote = async (payload) => {
  const quote = await Quote.create(payload);
  return quote;
};

module.exports = {
  getQuotes,
  getQuoteById,
  createQuote,
};