const QuoteSetup = require("./quoteSetup.model");

const getQuoteSetup = async () => {
  let setup = await QuoteSetup.findOne();
  if (!setup) {
    setup = await QuoteSetup.create({
      customerType: "Enterprise",
      currency: "S$",
      paymentTerm: "Net 30",
      discountRate: 5,
      taxRate: 10,
      basePrice: 0.42,
    });
  }
  return setup;
};

const updateQuoteSetup = async (data) => {
  let setup = await QuoteSetup.findOne();
  if (!setup) {
    setup = new QuoteSetup();
  }
  if (data.customerType !== undefined) setup.customerType = data.customerType;
  if (data.currency !== undefined) setup.currency = data.currency;
  if (data.paymentTerm !== undefined) setup.paymentTerm = data.paymentTerm;
  if (data.discountRate !== undefined) setup.discountRate = Number(data.discountRate);
  if (data.taxRate !== undefined) setup.taxRate = Number(data.taxRate);
  if (data.basePrice !== undefined) setup.basePrice = Number(data.basePrice);
  await setup.save();
  return setup;
};

module.exports = {
  getQuoteSetup,
  updateQuoteSetup,
};
