const quoteParametersService = require("./quoteParameters.service");

const getQuoteParameterOptions = (req, res) => {
  const options = quoteParametersService.getQuoteParameterOptions();

  res.status(200).json({
    status: "OK",
    message: "Quote parameter options fetched successfully",
    data: options,
  });
};

module.exports = {
  getQuoteParameterOptions,
};
