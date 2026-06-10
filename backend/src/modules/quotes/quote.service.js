const Quote = require("./quote.model");

const formatDate = (date) => {
  if (!date) return null;

  return new Date(date).toISOString().split("T")[0];
};

const formatCurrency = (amount) => {
  return `S$${Number(amount || 0).toLocaleString("en-SG")}`;
};

const mapStatusToCardLabel = (status) => {
  if (status === "Approved") return "Active";
  return status;
};

const mapQuoteToListDTO = (quote) => {
  return {
    id: quote._id,
    quoteNumber: quote.quoteNumber,

    status: quote.status,
    statusLabel: mapStatusToCardLabel(quote.status),

    companyName: quote.customerId?.companyName || "N/A",
    creationDate: formatDate(quote.createdAt),

    parameters: {
      boxStyle: quote.parameters?.boxStyle || "N/A",
      flute: quote.parameters?.flute || "N/A",
      moq: quote.parameters?.moq || "N/A",
    },

    totalPlaceholder: quote.totalPlaceholder,
    totalDisplay: formatCurrency(quote.totalPlaceholder),
  };
};

const getQuotes = async () => {
  const quotes = await Quote.find({
    status: {
      $in: ["Pending", "Approved"],
    },
  })
    .populate("customerId", "companyName contactName email")
    .populate("createdBy", "name email role")
    .sort({ createdAt: -1 });

  return quotes.map(mapQuoteToListDTO);
};

const getQuoteById = async (quoteId) => {
  const quote = await Quote.findById(quoteId)
    .populate("customerId", "companyName contactName email")
    .populate("createdBy", "name email role");

  if (!quote) return null;

  return mapQuoteToListDTO(quote);
};

const createQuote = async (payload) => {
  const quote = await Quote.create(payload);

  const createdQuote = await Quote.findById(quote._id)
    .populate("customerId", "companyName contactName email")
    .populate("createdBy", "name email role");

  return mapQuoteToListDTO(createdQuote);
};

module.exports = {
  getQuotes,
  getQuoteById,
  createQuote,
};