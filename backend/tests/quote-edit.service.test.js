const test = require("node:test");
const assert = require("node:assert/strict");

const Quote = require("../src/modules/quotes/quote.model");
const quoteService = require("../src/modules/quotes/quote.service");

const originalFindById = Quote.findById;

test("updateQuote rejects edits when quote is not Draft or AskedForEdit", async () => {
  Quote.findById = async () => ({
    _id: "507f1f77bcf86cd799439011",
    status: "Approved",
  });

  try {
    await assert.rejects(
      () =>
        quoteService.updateQuote("507f1f77bcf86cd799439011", {
          clientDetails: {
            companyName: "AMB Packaging Logistics",
            companyAddress: "22 Penjuru Rd, Singapore 609142",
            contactPerson: "Mr. Chen Wei",
            phoneNumber: "+65 6789 0123",
            email: "wei.chen@ambpack.com",
            billingAddress: "22 Penjuru Rd, Singapore 609142",
            deliveryAddress: "29 Gul Circle, Singapore 629585",
          },
          items: [],
        }),
      (error) => {
        assert.equal(error.statusCode, 409);
        assert.equal(error.message, "Only Draft or AskedForEdit quotes can be edited by Sales");
        return true;
      }
    );
  } finally {
    Quote.findById = originalFindById;
  }
});
