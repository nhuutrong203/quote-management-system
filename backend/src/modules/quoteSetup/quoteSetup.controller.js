const quoteSetupService = require("./quoteSetup.service");

const getQuoteSetup = async (req, res) => {
  try {
    const quoteSetup = await quoteSetupService.getQuoteSetup();
    res.status(200).json({
      status: "OKAY",
      message: "Quote setup fetched successfully",
      data: quoteSetup,
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: error.message,
    });
  }
};

const updateQuoteSetup = async (req, res) => {
  try {
    const quoteSetup = await quoteSetupService.updateQuoteSetup(req.body);
    res.status(200).json({
      status: "OKAY",
      message: "Quote setup updated successfully",
      data: quoteSetup,
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: error.message,
    });
  }
};

module.exports = {
  getQuoteSetup,
  updateQuoteSetup,
};