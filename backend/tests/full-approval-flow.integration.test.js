const test = require("node:test");
const assert = require("node:assert/strict");

const Quote = require("../src/modules/quotes/quote.model");
const Customer = require("../src/modules/customers/customer.model");
const quoteService = require("../src/modules/quotes/quote.service");
const orderConversionService = require("../src/modules/orders/orderConversion.service");
const notificationService = require("../src/modules/notifications/notification.service");

const originalQuoteFindById = Quote.findById;
const originalCustomerFindById = Customer.findById;
const originalCreateOrderFromApprovedQuote =
  orderConversionService.createOrderFromApprovedQuote;
const originalCreateApprovalStatusNotification =
  notificationService.createApprovalStatusNotification;

const actors = {
  sales: {
    id: "507f191e810c19729de860eb",
    name: "Siow",
    email: "siow@amb.com.sg",
    role: "Sales",
  },
  hod: {
    id: "507f191e810c19729de860ea",
    name: "HOD Singapore",
    email: "hod@amb.com.sg",
    role: "HOD",
  },
  scHead: {
    id: "507f191e810c19729de860ed",
    name: "SC Head Singapore",
    email: "schead@amb.com.sg",
    role: "SC_HEAD",
  },
  gm: {
    id: "507f191e810c19729de860ef",
    name: "GM Singapore",
    email: "gm@amb.com.sg",
    role: "GM",
  },
};

const buildQuery = (quote) => ({
  populate() {
    return this;
  },
  sort() {
    return this;
  },
  session() {
    return Promise.resolve(quote);
  },
  then(resolve, reject) {
    return Promise.resolve(quote).then(resolve, reject);
  },
});

const buildQuote = () => ({
  _id: "507f1f77bcf86cd799439011",
  quoteNumber: "#12345",
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
  status: "Pending",
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
  createdBy: actors.sales,
  history: [
    {
      status: "Pending",
      updatedBy: actors.sales,
      updatedAt: new Date("2026-06-17T08:00:00.000Z"),
      note: "Sales submitted to HOD.",
    },
  ],
  approvalHistory: [],
  async save() {
    this.saveCount = (this.saveCount || 0) + 1;
  },
});

const installMocks = ({ quote, orders, notifications }) => {
  Quote.findById = () => buildQuery(quote);
  Customer.findById = () => ({
    lean: async () => null,
  });
  orderConversionService.createOrderFromApprovedQuote = async (approvedQuote) => {
    const order = {
      id: "order-1",
      orderNumber: `ORD-${approvedQuote.quoteNumber.replace(/^#/, "")}`,
      quoteId: String(approvedQuote._id),
      status: "Draft",
    };
    orders.push(order);
    return order;
  };
  notificationService.createApprovalStatusNotification = async (payload) => {
    const notification = {
      quoteNumber: payload.quote.quoteNumber,
      actorRole: payload.actor.role,
      action: payload.transition.action,
      fromStatus: payload.fromStatus,
      toStatus: payload.toStatus,
    };
    notifications.push(notification);
    return notification;
  };
};

const restoreMocks = () => {
  Quote.findById = originalQuoteFindById;
  Customer.findById = originalCustomerFindById;
  orderConversionService.createOrderFromApprovedQuote =
    originalCreateOrderFromApprovedQuote;
  notificationService.createApprovalStatusNotification =
    originalCreateApprovalStatusNotification;
};

test("AP-01 to AP-03 full approval flow updates DB state and creates an order", async () => {
  const quote = buildQuote();
  const orders = [];
  const notifications = [];
  installMocks({ quote, orders, notifications });

  try {
    const hodResult = await quoteService.updateQuoteStatus(String(quote._id), {
      action: "approve",
      note: "HOD approved.",
      actor: actors.hod,
    });

    assert.equal(hodResult.status, "Processing");
    assert.equal(quote.status, "Processing");
    assert.equal(quote.history.at(-1).status, "Processing");

    const scResult = await quoteService.updateQuoteStatus(String(quote._id), {
      action: "approve",
      note: "SC Head approved.",
      actor: actors.scHead,
    });

    assert.equal(scResult.status, "PendingApproval");
    assert.equal(quote.status, "PendingApproval");
    assert.equal(quote.history.at(-1).status, "PendingApproval");

    const gmResult = await quoteService.updateQuoteStatus(String(quote._id), {
      action: "approve",
      note: "GM final approved.",
      actor: actors.gm,
    });

    assert.equal(gmResult.quote.status, "Approved");
    assert.equal(quote.status, "Approved");
    assert.equal(quote.history.at(-1).status, "Approved");
    assert.equal(orders.length, 1);
    assert.equal(orders[0].orderNumber, "ORD-12345");
    assert.equal(notifications.length, 3);
    assert.deepEqual(
      notifications.map((notification) => notification.toStatus),
      ["Processing", "PendingApproval", "Approved"]
    );
    assert.equal(quote.approvalHistory.length, 3);
    assert.equal(quote.saveCount, 3);
  } finally {
    restoreMocks();
  }
});

test("GM hard reject keeps quote data with Rejected status and does not create order", async () => {
  const quote = buildQuote();
  quote.status = "PendingApproval";
  const orders = [];
  const notifications = [];
  installMocks({ quote, orders, notifications });

  try {
    const result = await quoteService.updateQuoteStatus(String(quote._id), {
      action: "reject",
      note: "Margin rejected.",
      actor: actors.gm,
    });

    assert.equal(result.status, "Rejected");
    assert.equal(quote.status, "Rejected");
    assert.equal(quote.quoteNumber, "#12345");
    assert.equal(quote.items.length, 1);
    assert.equal(orders.length, 0);
    assert.equal(notifications.length, 1);
    assert.equal(notifications[0].toStatus, "Rejected");
  } finally {
    restoreMocks();
  }
});
