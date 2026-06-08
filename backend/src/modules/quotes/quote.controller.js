const quoteService = require("./quote.service");

const getQuotes = (req, res) => {
  const quotes = quoteService.getAllQuotes();

  res.status(200).json({
    status: "OKAY",
    message: "Quotes fetched successfully",
    data: quotes,
  });
};

module.exports = {
  getQuotes,
};