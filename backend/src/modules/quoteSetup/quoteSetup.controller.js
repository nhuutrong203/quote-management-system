const quoteSetupService = require("./quoteSetup.service");

const getQuoteSetup = (req, res) => {
  const quoteSetup = quoteSetupService.getQuoteSetup();

  res.status(200).json({
    status: "OKAY",
    message: "Quote setup fetched successfully",
    data: quoteSetup,
  });
};

module.exports = {
  getQuoteSetup,
};