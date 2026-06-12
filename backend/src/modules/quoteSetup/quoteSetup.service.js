const mockQuoteSetup = {
  customerType: "Enterprise",
  currency: "S$",
  paymentTerm: "Net 30",
  discountRate: 5,
  taxRate: 10,
};

const parameterOptions = {
  boxStyles: ["Corrugated", "Offset", "Offset Laminated"],

  types: ["RSC", "FOL", "Two-piece", "Tray", "Sleeve"],

  dimensions: ["ID L x W x H mm", "OD L x W x H mm"],

  flutes: ["B", "C", "E", "F", "BC", "BE"],

  boardQualities: ["125 GSM", "150 GSM", "200 GSM", "250 GSM", "300 GSM"],

  colors: ["1/2", "2/3", "3/4", "4/4+varnish"],

  joints: ["Glue", "Stitch"],

  moqOptions: ["Based on enquiry", "1k", "3k", "5k", "10k"],
};

const getQuoteSetup = () => {
  return mockQuoteSetup;
};

const getParameterOptions = () => {
  return parameterOptions;
};

module.exports = {
  getQuoteSetup,
  getParameterOptions,
};