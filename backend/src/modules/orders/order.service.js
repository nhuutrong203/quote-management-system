const mongoose = require("mongoose");
const Order = require("./order.model");
const Quote = require("../quotes/quote.model");
const {
  DEFAULT_ORDER_DETAIL_ROWS,
  DEFAULT_ORDER_TOTAL_LABEL,
  mockOrderPreviews,
} = require("../../seed/order.seed-data");

const isDatabaseConnected = () => mongoose.connection.readyState === 1;

const buildOrderNumber = (quoteNumber) => {
  const normalizedQuoteNumber = String(quoteNumber || "12345").replace(/^#/, "");
  return `ORD-${normalizedQuoteNumber}`;
};

const mapOrderRows = (rows = []) =>
  (rows.length > 0 ? rows : DEFAULT_ORDER_DETAIL_ROWS).map((row) => ({
    boxStyle: row.boxStyle || "Corrugated",
    type: row.type || "RSC",
    dimension: row.dimension || "ID (L x W x H mm)",
    fluteType: row.fluteType || "B",
    boardQuality: row.boardQuality || "150 GSM",
    colors: row.colors || "2",
    joints: row.joints || "Glue",
    moq: String(row.moq || "5000"),
  }));

const mapQuoteItemsToOrderRows = (items = []) =>
  items.length > 0
    ? items.map((item) => ({
        boxStyle: item.boxStyle || "Corrugated",
        type: item.type || "RSC",
        dimension: item.dimension || "ID (L x W x H mm)",
        fluteType: item.fluteType || "B",
        boardQuality: item.boardQuality || "150 GSM",
        colors: item.colors || "2",
        joints: item.joints || "Glue",
        moq: String(item.moq || item.quantity || "5000"),
      }))
    : DEFAULT_ORDER_DETAIL_ROWS;

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
  orderDetailsRows: mapOrderRows(
    order.orderDetailsRows || (order.orderDetails ? [order.orderDetails] : [])
  ),
});

const buildOrderPreviewFromOrder = (order) => ({
  orderId: order.orderNumber || order.orderId,
  quoteId: String(order.quoteId?._id || order.quoteId || ""),
  quoteNumber: order.quoteId?.quoteNumber || order.quoteNumber || "#12345",
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
    billingAddress:
      order.customerSnapshot?.billingAddress ||
      order.customerId?.address ||
      "Billing address placeholder",
    deliveryAddress:
      order.customerSnapshot?.deliveryAddress ||
      order.customerId?.address ||
      "Delivery address placeholder",
  },
  orderDetailsRows: mapOrderRows(
    order.orderDetailsRows || (order.orderDetails ? [order.orderDetails] : [])
  ),
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

const buildOrderPreviewFromQuote = (quote) => ({
  orderId: buildOrderNumber(quote.quoteNumber),
  quoteId: String(quote._id),
  quoteNumber: quote.quoteNumber || "#12345",
  status: "Draft",
  quoteTotalLabel: DEFAULT_ORDER_TOTAL_LABEL,
  customer: {
    companyName: quote.clientDetails?.companyName || quote.customerId?.companyName || "Customer placeholder",
    contactName: quote.clientDetails?.contactPerson || quote.customerId?.contactName || "Contact placeholder",
    email: quote.clientDetails?.email || quote.customerId?.email || "customer@example.com",
    phone: quote.clientDetails?.phoneNumber || quote.customerId?.phone || "+65 6000 0000",
    address: quote.clientDetails?.companyAddress || quote.customerId?.address || "Customer address placeholder",
    billingAddress:
      quote.clientDetails?.billingAddress || quote.customerId?.address || "Billing address placeholder",
    deliveryAddress:
      quote.clientDetails?.deliveryAddress || quote.customerId?.address || "Delivery address placeholder",
  },
  orderDetailsRows: mapQuoteItemsToOrderRows(quote.items || []),
});

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
