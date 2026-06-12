const Quote = require("./quote.model");

const formatCurrency = (amount) => {
  return `S$${Number(amount || 0).toLocaleString("en-SG")}`;
};

const getStatusLabel = (status) => {
  const statusLabels = {
    Draft: "Draft",
    Pending: "Pending",
    Processing: "Processing",
    PendingApproval: "Pending approval",
    Approved: "Active",
    Rejected: "Rejected",
    AskedForEdit: "Asked for edit",
  };

  return statusLabels[status] || status;
};

const sanitizeUser = (user) => {
  if (!user) return null;

  return {
    id: String(user._id || user.id),
    name: user.name,
    email: user.email,
    role: user.role,
  };
};

const sanitizeCustomer = (customer) => {
  if (!customer) return null;

  return {
    id: String(customer._id || customer.id),
    companyName: customer.companyName,
    contactName: customer.contactName || "",
    email: customer.email || "",
    phone: customer.phone || "",
    address: customer.address || "",
    taxCode: customer.taxCode || "",
  };
};

const buildDefaultItem = (quote) => {
  const moqValue = Number(String(quote.parameters?.moq || "0").replace(/[^0-9.]/g, ""));
  const safeQuantity = moqValue > 0 ? moqValue : 1;

  return {
    name: `${quote.parameters?.boxStyle || "Packaging"} Box Production`,
    quantity: safeQuantity,
    unitPrice: Number((quote.totalPlaceholder || 0) / safeQuantity),
  };
};

const buildDefaultHistory = (quote) => {
  const updatedBy = sanitizeUser(quote.createdBy);

  return [
    {
      status: quote.status,
      updatedBy,
      updatedAt: quote.updatedAt || quote.createdAt,
      note: "Quote status initialized",
    },
  ];
};

const mapQuoteToClientDTO = (quote) => {
  const customer = sanitizeCustomer(quote.customerId);
  const createdBy = sanitizeUser(quote.createdBy);
  const items = quote.items?.length ? quote.items : [buildDefaultItem(quote)];
  const history = quote.history?.length
    ? quote.history.map((entry) => ({
        status: entry.status,
        updatedBy: sanitizeUser(entry.updatedBy),
        updatedAt: entry.updatedAt,
        note: entry.note || "",
      }))
    : buildDefaultHistory(quote);

  return {
    id: String(quote._id),
    quoteNumber: quote.quoteNumber,
    status: quote.status,
    customer,
    customerId: customer?.id || null,
    companyName: customer?.companyName || "N/A",
    contactName: customer?.contactName || "",
    creationDate: quote.createdAt,
    createdAt: quote.createdAt,
    createdBy,
    statusLabel: getStatusLabel(quote.status),
    boxStyle: quote.parameters?.boxStyle || "N/A",
    type: quote.type || "Single Wall",
    dimension: quote.dimension || "40x30x30",
    fluteType: quote.parameters?.flute || "N/A",
    boardQuality: quote.boardQuality || "N/A",
    colors: quote.colors || "N/A",
    joints: quote.joints || "N/A",
    moq: quote.parameters?.moq || "N/A",
    parameters: {
      boxStyle: quote.parameters?.boxStyle || "N/A",
      flute: quote.parameters?.flute || "N/A",
      moq: quote.parameters?.moq || "N/A",
    },
    items,
    history,
    totalPlaceholder: quote.totalPlaceholder,
    totalDisplay: formatCurrency(quote.totalPlaceholder),
  };
};

const populateQuoteQuery = (query) =>
  query
    .populate("customerId", "companyName contactName email phone address taxCode")
    .populate("createdBy", "name email role")
    .populate("history.updatedBy", "name email role");

const getQuotes = async () => {
  const quotes = await populateQuoteQuery(Quote.find()).sort({ createdAt: -1 });

  return quotes.map(mapQuoteToClientDTO);
};

const getQuoteById = async (quoteId) => {
  const quote = await populateQuoteQuery(Quote.findById(quoteId));

  if (!quote) return null;

  return mapQuoteToClientDTO(quote);
};

const createQuote = async (payload) => {
  const totalPlaceholder =
    payload.totalPlaceholder ??
    (payload.items || []).reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
      0
    );

  const quote = await Quote.create({
    quoteNumber: payload.quoteNumber,
    customerId: payload.customerId,
    status: payload.status || "Draft",
    parameters: {
      boxStyle: payload.boxStyle || payload.parameters?.boxStyle || "N/A",
      flute: payload.fluteType || payload.parameters?.flute || "N/A",
      moq: payload.moq || payload.parameters?.moq || "N/A",
    },
    type: payload.type || "Single Wall",
    dimension: payload.dimension || "40x30x30",
    boardQuality: payload.boardQuality || "N/A",
    colors: payload.colors || "N/A",
    joints: payload.joints || "N/A",
    items: payload.items || [],
    totalPlaceholder,
    createdBy: payload.createdBy,
    history: [
      {
        status: payload.status || "Draft",
        updatedBy: payload.createdBy,
        updatedAt: new Date(),
        note:
          payload.note ||
          ((payload.status || "Draft") === "Pending"
            ? "Quote submitted for approval"
            : "Quote created"),
      },
    ],
  });

  const createdQuote = await populateQuoteQuery(Quote.findById(quote._id));

  return mapQuoteToClientDTO(createdQuote);
};

const updateQuote = async (quoteId, payload) => {
  const quote = await Quote.findById(quoteId);

  if (!quote) {
    return null;
  }

  if (payload.customerId) {
    quote.customerId = payload.customerId;
  }

  if (payload.status) {
    quote.status = payload.status;
  }

  if (payload.boxStyle || payload.fluteType || payload.moq) {
    quote.parameters = {
      ...quote.parameters,
      ...(payload.boxStyle ? { boxStyle: payload.boxStyle } : {}),
      ...(payload.fluteType ? { flute: payload.fluteType } : {}),
      ...(payload.moq ? { moq: payload.moq } : {}),
    };
  }

  if (payload.type !== undefined) {
    quote.type = payload.type;
  }

  if (payload.dimension !== undefined) {
    quote.dimension = payload.dimension;
  }

  if (payload.boardQuality !== undefined) {
    quote.boardQuality = payload.boardQuality;
  }

  if (payload.colors !== undefined) {
    quote.colors = payload.colors;
  }

  if (payload.joints !== undefined) {
    quote.joints = payload.joints;
  }

  if (Array.isArray(payload.items)) {
    quote.items = payload.items;
  }

  if (payload.totalPlaceholder !== undefined) {
    quote.totalPlaceholder = payload.totalPlaceholder;
  } else if (Array.isArray(payload.items)) {
    quote.totalPlaceholder = payload.items.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
      0
    );
  }

  if (payload.status && payload.updatedBy) {
    quote.history.push({
      status: payload.status,
      updatedBy: payload.updatedBy,
      updatedAt: new Date(),
      note: payload.note || "",
    });
  }

  await quote.save();

  const updatedQuote = await populateQuoteQuery(Quote.findById(quote._id));

  return mapQuoteToClientDTO(updatedQuote);
};

module.exports = {
  getQuotes,
  getQuoteById,
  createQuote,
  updateQuote,
};
