const mockQuoteSetup = {
  customerType: "Enterprise",
  currency: "S$",
  paymentTerm: "Net 30",
  discountRate: 5,
  taxRate: 10,
};

const getQuoteSetup = () => {
  return mockQuoteSetup;
};

module.exports = {
  getQuoteSetup,
};
