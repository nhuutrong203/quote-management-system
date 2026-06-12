const quoteSetupService = require("./quoteSetup.service");

const getQuoteSetup = (req, res) => {
  const quoteSetup = quoteSetupService.getQuoteSetup();

  res.status(200).json({
    status: "OKAY",
    message: "Quote setup fetched successfully",
    data: quoteSetup,
  });
};

const getParameterOptions = (req, res) => {
  const parameterOptions = quoteSetupService.getParameterOptions();

  res.status(200).json({
    status: "OKAY",
    message: "Quote setup parameter options fetched successfully",
    data: parameterOptions,
  });
};

module.exports = {
  getQuoteSetup,
  getParameterOptions,
};