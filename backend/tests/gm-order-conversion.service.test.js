const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const Quote = require("../src/modules/quotes/quote.model");
const Customer = require("../src/modules/customers/customer.model");
const quoteService = require("../src/modules/quotes/quote.service");
const orderConversionService = require("../src/modules/orders/orderConversion.service");
const notificationService = require("../src/modules/notifications/notification.service");

const originalReadyState = mongoose.connection.readyState;
const originalStartSession = mongoose.startSession;
const originalQuoteFindById = Quote.findById;
const originalCustomerFindById = Customer.findById;
const originalCreateOrderFromApprovedQuote =
  orderConversionService.createOrderFromApprovedQuote;
const originalCreateApprovalStatusNotification =
  notificationService.createApprovalStatusNotification;

const buildQuoteQuery = (quote) => ({
  populate() {
    return this;
  },
  session() {
    return Promise.resolve(quote);
  },
  then(resolve, reject) {
    return Promise.resolve(quote).then(resolve, reject);
  },
});

const buildPendingApprovalQuote = () => ({
  _id: "507f1f77bcf86cd799439011",
  quoteNumber: "#12996",
  customerId: "507f191e810c19729de860ec",
  clientDetails: {
    companyName: "AMB Packaging Logistics",
    companyAddress: "22 Penjuru Rd, Singapore 609142",
    contactPerson: "Mr. Chen Wei",
    phoneNumber: "+65 6789 0123",
    email: "wei.chen@ambpack.com",
    billingAddress: "22 Penjuru Rd, Singapore 609142",
    deliveryAddress: "29 Gul Circle, Singapore 629585",
  },
  status: "PendingApproval",
  parameters: { boxStyle: "Corrugated", flute: "B", moq: "5000" },
  type: "RSC",
  dimension: "ID 400x300x200",
  boardQuality: "125 GSM",
  colors: "4 colors",
  joints: "Glue",
  items: [
    {
      name: "Corrugated RSC carton",
      boxStyle: "Corrugated",
      type: "RSC",
      dimension: "ID 400x300x200",
      fluteType: "B",
      boardQuality: "125 GSM",
      colors: "4 colors",
      joints: "Glue",
      moq: "5000",
      quantity: 5000,
      unitPrice: 0.52,
    },
  ],
  totalPlaceholder: 2600,
  history: [],
  approvalHistory: [],
  saveOptions: null,
  async save(options) {
    this.saveOptions = options;
  },
});

const installTransactionMocks = ({ quote, onCreateOrder }) => {
  const session = {
    async withTransaction(callback) {
      return callback();
    },
    async endSession() {
      session.ended = true;
    },
    ended: false,
  };

  Object.defineProperty(mongoose.connection, "readyState", {
    value: 1,
    configurable: true,
  });

  mongoose.startSession = async () => session;
  Quote.findById = () => buildQuoteQuery(quote);
  Customer.findById = () => ({
    lean: async () => null,
  });
  orderConversionService.createOrderFromApprovedQuote = onCreateOrder;
  notificationService.createApprovalStatusNotification = async () => ({
    id: "notification-1",
    message: "Quote #12996 was approved by GM",
  });

  return session;
};

const restoreMocks = () => {
  Object.defineProperty(mongoose.connection, "readyState", {
    value: originalReadyState,
    configurable: true,
  });

  mongoose.startSession = originalStartSession;
  Quote.findById = originalQuoteFindById;
  Customer.findById = originalCustomerFindById;
  orderConversionService.createOrderFromApprovedQuote =
    originalCreateOrderFromApprovedQuote;
  notificationService.createApprovalStatusNotification =
    originalCreateApprovalStatusNotification;
};

test("GM final approval approves the quote and creates an order in one transaction", async () => {
  const quote = buildPendingApprovalQuote();
  let capturedOrderQuote = null;
  let capturedOrderSession = null;

  const session = installTransactionMocks({
    quote,
    onCreateOrder: async (approvedQuote, options) => {
      capturedOrderQuote = approvedQuote;
      capturedOrderSession = options.session;

      return {
        id: "order-1",
        orderNumber: "ORD-12996",
        quoteId: String(approvedQuote._id),
        status: "Draft",
      };
    },
  });

  try {
    const result = await quoteService.updateQuoteStatus(String(quote._id), {
      action: "approve",
      actor: {
        id: "507f191e810c19729de860ef",
        name: "GM Singapore",
        email: "gm@amb.com.sg",
        role: "GM",
      },
    });

    assert.equal(quote.status, "Approved");
    assert.equal(quote.saveOptions.session, session);
    assert.equal(capturedOrderQuote, quote);
    assert.equal(capturedOrderSession, session);
    assert.equal(result.quote.status, "Approved");
    assert.equal(result.order.orderNumber, "ORD-12996");
    assert.equal(session.ended, true);
  } finally {
    restoreMocks();
  }
});

test("GM final approval propagates order conversion failures so the transaction can roll back", async () => {
  const quote = buildPendingApprovalQuote();
  const session = installTransactionMocks({
    quote,
    onCreateOrder: async () => {
      throw new Error("Order conversion failed");
    },
  });

  try {
    await assert.rejects(
      () =>
        quoteService.updateQuoteStatus(String(quote._id), {
          action: "approve",
          actor: {
            id: "507f191e810c19729de860ef",
            name: "GM Singapore",
            email: "gm@amb.com.sg",
            role: "GM",
          },
        }),
      /Order conversion failed/
    );

    assert.equal(session.ended, true);
  } finally {
    restoreMocks();
  }
});
