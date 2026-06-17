const Order = require("./order.model");

const formatCurrency = (amount) =>
  `S$${Number(amount || 0).toLocaleString("en-SG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const buildOrderNumber = (quoteNumber) => {
  const normalizedQuoteNumber = String(quoteNumber || "12345").replace(/^#/, "");
  return `ORD-${normalizedQuoteNumber}`;
};

const mapQuoteItemsToOrderRows = (items = []) =>
  items.map((item) => ({
    boxStyle: item.boxStyle || "Corrugated",
    type: item.type || "RSC",
    dimension: item.dimension || "ID (L x W x H mm)",
    fluteType: item.fluteType || "B",
    boardQuality: item.boardQuality || "150 GSM",
    colors: item.colors || "2",
    joints: item.joints || "Glue",
    moq: String(item.moq || item.quantity || "5000"),
  }));

const mapOrderToDTO = (order) => {
  if (!order) return null;

  return {
    id: String(order._id || order.id || ""),
    orderNumber: order.orderNumber,
    orderId: order.orderNumber,
    quoteId: String(order.quoteId?._id || order.quoteId || ""),
    customerId: String(order.customerId?._id || order.customerId || ""),
    status: order.status,
    quoteTotalLabel: order.quoteTotalLabel,
    customer: {
      companyName: order.customerSnapshot?.companyName || "",
      contactName: order.customerSnapshot?.contactName || "",
      email: order.customerSnapshot?.email || "",
      phone: order.customerSnapshot?.phone || "",
      address: order.customerSnapshot?.address || "",
      billingAddress: order.customerSnapshot?.billingAddress || "",
      deliveryAddress: order.customerSnapshot?.deliveryAddress || "",
    },
    orderDetailsRows: order.orderDetailsRows || [],
  };
};

const createOrderFromApprovedQuote = async (quote, { session } = {}) => {
  const existingQuery = Order.findOne({ quoteId: quote._id });
  const existingOrder =
    session && typeof existingQuery.session === "function"
      ? await existingQuery.session(session)
      : await existingQuery;

  if (existingOrder) {
    return mapOrderToDTO(existingOrder);
  }

  const orderDetailsRows = mapQuoteItemsToOrderRows(quote.items || []);
  const leadRow = orderDetailsRows[0] || {};
  const orderPayload = {
    orderNumber: buildOrderNumber(quote.quoteNumber),
    quoteId: quote._id,
    customerId: quote.customerId,
    status: "Draft",
    orderDetails: leadRow,
    orderDetailsRows,
    quoteTotalLabel: formatCurrency(quote.totalPlaceholder),
    customerSnapshot: {
      companyName: quote.clientDetails?.companyName || "",
      contactName: quote.clientDetails?.contactPerson || "",
      email: quote.clientDetails?.email || "",
      phone: quote.clientDetails?.phoneNumber || "",
      address: quote.clientDetails?.companyAddress || "",
      billingAddress: quote.clientDetails?.billingAddress || "",
      deliveryAddress: quote.clientDetails?.deliveryAddress || "",
    },
  };

  const createdOrders = await Order.create([orderPayload], session ? { session } : undefined);
  return mapOrderToDTO(createdOrders[0]);
};

module.exports = {
  buildOrderNumber,
  createOrderFromApprovedQuote,
  mapOrderToDTO,
};
