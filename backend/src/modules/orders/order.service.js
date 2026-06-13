const mongoose = require("mongoose");
const Order = require("./order.model");
const Quote = require("../quotes/quote.model");
const { DEFAULT_ORDER_TOTAL_LABEL, mockOrderPreviews } = require("./order.mock");

const isDatabaseConnected = () => mongoose.connection.readyState === 1;

const buildOrderNumber = (quoteNumber) => {
  const normalizedQuoteNumber = String(quoteNumber || "12345").replace(/^#/, "");
  return `ORD-${normalizedQuoteNumber}`;
};

const buildOrderListItem = (order) => ({
  id: order.id || String(order._id || ""),
  orderId: order.orderId || order.orderNumber,
  quoteId: order.quoteId?.id || String(order.quoteId?._id || order.quoteId || ""),
  quoteNumber: order.quoteNumber || order.quoteId?.quoteNumber || "#12345",
  status: order.status || "Draft",
  quoteTotalLabel: order.quoteTotalLabel || DEFAULT_ORDER_TOTAL_LABEL,
  customer: {
    companyName:
      order.customer?.companyName ||
      order.customerSnapshot?.companyName ||
      order.customerId?.companyName ||
      "Customer placeholder",
    contactName:
      order.customer?.contactName ||
      order.customerSnapshot?.contactName ||
      order.customerId?.contactName ||
      "Contact placeholder",
  },
  orderDetails: {
    boxStyle: order.orderDetails?.boxStyle || "Corrugated",
    type: order.orderDetails?.type || "RSC",
    dimension: order.orderDetails?.dimension || "ID (L x W x H mm)",
    fluteType: order.orderDetails?.fluteType || "B",
    boardQuality: order.orderDetails?.boardQuality || "150 GSM",
    colors: order.orderDetails?.colors || "2",
    joints: order.orderDetails?.joints || "Glue",
    moq: order.orderDetails?.moq || "5k",
  },
});

const buildOrderPreviewFromOrder = (order) => ({
  orderId: order.orderNumber,
  quoteId: String(order.quoteId?._id || order.quoteId || ""),
  quoteNumber: order.quoteId?.quoteNumber || "#12345",
  status: order.status || "Draft",
  quoteTotalLabel: order.quoteTotalLabel || DEFAULT_ORDER_TOTAL_LABEL,
  customer: {
    companyName:
      order.customerSnapshot?.companyName ||
      order.customerId?.companyName ||
      "Customer placeholder",
    contactName:
      order.customerSnapshot?.contactName ||
      order.customerId?.contactName ||
      "Contact placeholder",
    email:
      order.customerSnapshot?.email ||
      order.customerId?.email ||
      "customer@example.com",
    phone:
      order.customerSnapshot?.phone ||
      order.customerId?.phone ||
      "+65 6000 0000",
    address:
      order.customerSnapshot?.address ||
      order.customerId?.address ||
      "Customer address placeholder",
  },
  orderDetails: {
    boxStyle: order.orderDetails?.boxStyle || "Corrugated",
    type: order.orderDetails?.type || "RSC",
    dimension: order.orderDetails?.dimension || "ID (L x W x H mm)",
    fluteType: order.orderDetails?.fluteType || "B",
    boardQuality: order.orderDetails?.boardQuality || "150 GSM",
    colors: order.orderDetails?.colors || "2",
    joints: order.orderDetails?.joints || "Glue",
    moq: order.orderDetails?.moq || "5k",
  },
});

const getOrders = async () => {
  if (!isDatabaseConnected()) {
    return mockOrderPreviews.map(buildOrderListItem);
  }

  const orders = await Order.find()
    .populate("quoteId", "quoteNumber")
    .populate("customerId", "companyName contactName")
    .sort({ createdAt: -1 })
    .lean();

  return orders.map(buildOrderListItem);
};

const buildOrderPreviewFromQuote = (quote) => {
  return {
    orderId: buildOrderNumber(quote.quoteNumber),
    quoteId: String(quote._id),
    quoteNumber: quote.quoteNumber,
    status: "Draft",
    quoteTotalLabel: DEFAULT_ORDER_TOTAL_LABEL,
    customer: {
      companyName: quote.customerId?.companyName || "Customer placeholder",
      contactName: quote.customerId?.contactName || "Contact placeholder",
      email: quote.customerId?.email || "customer@example.com",
      phone: quote.customerId?.phone || "+65 6000 0000",
      address: quote.customerId?.address || "Customer address placeholder",
    },
    orderDetails: {
      boxStyle: quote.parameters?.boxStyle || "Corrugated",
      type: quote.type || "RSC",
      dimension: quote.dimension || "ID (L x W x H mm)",
      fluteType: quote.parameters?.flute || "B",
      boardQuality: quote.boardQuality || "150 GSM",
      colors: quote.colors || "2",
      joints: quote.joints || "Glue",
      moq: quote.parameters?.moq || "5k",
    },
  };
};

const getOrderForm = async (quoteId) => {
  if (!quoteId || !isDatabaseConnected() || !mongoose.isValidObjectId(quoteId)) {
    return mockOrderPreviews[0];
  }

  const existingOrder = await Order.findOne({ quoteId })
    .populate("quoteId", "quoteNumber")
    .populate("customerId", "companyName contactName email phone address")
    .lean();

  if (existingOrder) {
    return buildOrderPreviewFromOrder(existingOrder);
  }

  const quote = await Quote.findById(quoteId)
    .populate("customerId", "companyName contactName email phone address")
    .lean();

  if (!quote) {
    return mockOrderPreviews[0];
  }

  return buildOrderPreviewFromQuote(quote);
};

module.exports = {
  getOrders,
  getOrderForm,
};
