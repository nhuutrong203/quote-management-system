const mongoose = require("mongoose");

const quoteSetupSchema = new mongoose.Schema(
  {
    customerType: { type: String, default: "Enterprise" },
    currency: { type: String, default: "S$" },
    paymentTerm: { type: String, default: "Net 30" },
    discountRate: { type: Number, default: 5 },
    taxRate: { type: Number, default: 10 },
    basePrice: { type: Number, default: 0.42 },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("QuoteSetup", quoteSetupSchema);