const Quote = require("./quote.model");
const Customer = require("../customers/customer.model");
const User = require("../users/user.model");
const {
  APPROVAL_ACTIONS,
  buildApprovalAuditEntry,
  getApprovalTransition,
} = require("./quoteApproval.service");

const formatCurrency = (amount) => {
  return `S$${Number(amount || 0).toLocaleString("en-SG")}`;
};

const parseMoqQuantity = (value) => {
  const normalized = String(value || "").toLowerCase().replace(/,/g, "").trim();

  if (!normalized) {
    return 1;
  }

  if (normalized === "based on enquiry") {
    return 1000;
  }

  if (normalized.endsWith("k")) {
    const parsedThousands = Number(normalized.replace(/[^0-9.]/g, ""));
    return parsedThousands > 0 ? parsedThousands * 1000 : 1;
  }

  const parsedDigits = Number(normalized.replace(/[^0-9.]/g, ""));
  return parsedDigits > 0 ? parsedDigits : 1;
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

const sanitizeClientDetails = (details = {}, customer = null) => ({
  companyName: details.companyName || customer?.companyName || "",
  companyAddress: details.companyAddress || customer?.address || "",
  contactPerson: details.contactPerson || details.contactName || customer?.contactName || "",
  phoneNumber: details.phoneNumber || customer?.phone || "",
  email: String(details.email || customer?.email || "").toLowerCase(),
  billingAddress: details.billingAddress || details.companyAddress || customer?.address || "",
  deliveryAddress: details.deliveryAddress || details.companyAddress || customer?.address || "",
});

const sanitizeQuoteItem = (item = {}, fallback = {}) => {
  const moq = item.moq || fallback.moq || "5k";
  const quantity =
    Number(item.quantity || 0) > 0
      ? Number(item.quantity)
      : parseMoqQuantity(moq);

  return {
    name:
      item.name ||
      `${item.boxStyle || fallback.boxStyle || "Corrugated"} Box Production (${item.type || fallback.type || "RSC"})`,
    boxStyle: item.boxStyle || fallback.boxStyle || "Corrugated",
    type: item.type || fallback.type || "RSC",
    dimension: item.dimension || fallback.dimension || "ID (L x W x H mm)",
    fluteType: item.fluteType || fallback.fluteType || "B",
    boardQuality: item.boardQuality || fallback.boardQuality || "150 GSM",
    colors: item.colors || fallback.colors || "2",
    joints: item.joints || fallback.joints || "Glue",
    moq,
    quantity,
    unitPrice: Number(item.unitPrice || fallback.unitPrice || 0),
  };
};

const buildFallbackItems = (quote) => {
  const safeQuantity = parseMoqQuantity(quote.parameters?.moq || quote.moq);
  const baseItem = sanitizeQuoteItem(
    {
      name: `${quote.parameters?.boxStyle || "Corrugated"} Box Production`,
      boxStyle: quote.parameters?.boxStyle || quote.boxStyle,
      type: quote.type,
      dimension: quote.dimension,
      fluteType: quote.parameters?.flute || quote.fluteType,
      boardQuality: quote.boardQuality,
      colors: quote.colors,
      joints: quote.joints,
      moq: quote.parameters?.moq || quote.moq,
      quantity: safeQuantity,
      unitPrice: Number((quote.totalPlaceholder || 0) / Math.max(safeQuantity, 1)),
    },
    {}
  );

  return [baseItem];
};

const buildStatusHistoryEntry = ({ status, updatedBy, updatedAt = new Date(), note = "" }) => ({
  status,
  updatedBy,
  updatedAt,
  note,
});

const buildInitialApprovalHistory = (quote, actor, action, note) => [
  buildApprovalAuditEntry({
    actor,
    action,
    fromStatus: quote.status === "Pending" ? "Draft" : "",
    toStatus: quote.status,
    note,
    timestamp: quote.createdAt || new Date(),
  }),
];

const mapQuoteToClientDTO = (quote) => {
  const customer = sanitizeCustomer(quote.customerId);
  const createdBy = sanitizeUser(quote.createdBy);
  const clientDetails = sanitizeClientDetails(quote.clientDetails || {}, quote.customerId);
  const items =
    quote.items?.length > 0
      ? quote.items.map((item) =>
          sanitizeQuoteItem(item, {
            boxStyle: quote.parameters?.boxStyle,
            type: quote.type,
            dimension: quote.dimension,
            fluteType: quote.parameters?.flute,
            boardQuality: quote.boardQuality,
            colors: quote.colors,
            joints: quote.joints,
            moq: quote.parameters?.moq,
          })
        )
      : buildFallbackItems(quote);
  const leadItem = items[0] || sanitizeQuoteItem();
  const history = quote.history?.length
    ? quote.history.map((entry) => ({
        status: entry.status,
        updatedBy: sanitizeUser(entry.updatedBy),
        updatedAt: entry.updatedAt,
        note: entry.note || "",
      }))
    : [];
  const approvalHistory = quote.approvalHistory?.length
    ? quote.approvalHistory.map((entry) => ({
        actorId: entry.actorId ? String(entry.actorId) : "",
        actorName: entry.actorName || "",
        actorEmail: entry.actorEmail || "",
        actorRole: entry.actorRole || "",
        action: entry.action,
        fromStatus: entry.fromStatus || "",
        toStatus: entry.toStatus || "",
        note: entry.note || "",
        timestamp: entry.timestamp,
      }))
    : buildInitialApprovalHistory(
        quote,
        createdBy || { name: "System", email: "", role: "Sales", id: "" },
        quote.status === "Pending" ? "Submitted" : "Created",
        history[0]?.note || "Quote created"
      );

  return {
    id: String(quote._id),
    quoteNumber: quote.quoteNumber,
    status: quote.status,
    customer,
    customerId: customer?.id || null,
    clientDetails,
    companyName: clientDetails.companyName || customer?.companyName || "N/A",
    contactName: clientDetails.contactPerson || customer?.contactName || "",
    creationDate: quote.createdAt,
    createdAt: quote.createdAt,
    createdBy,
    statusLabel: quote.status === "Approved" ? "Active" : quote.status,
    boxStyle: leadItem.boxStyle,
    type: leadItem.type,
    dimension: leadItem.dimension,
    fluteType: leadItem.fluteType,
    boardQuality: leadItem.boardQuality,
    colors: leadItem.colors,
    joints: leadItem.joints,
    moq: leadItem.moq,
    parameters: {
      boxStyle: leadItem.boxStyle,
      flute: leadItem.fluteType,
      moq: leadItem.moq,
    },
    items,
    history,
    approvalHistory,
    totalPlaceholder: Number(quote.totalPlaceholder || 0),
    totalDisplay: formatCurrency(quote.totalPlaceholder),
  };
};

const populateQuoteQuery = (query) =>
  query
    .populate("customerId", "companyName contactName email phone address taxCode")
    .populate("createdBy", "name email role")
    .populate("history.updatedBy", "name email role");

const getCustomerById = async (customerId) => {
  if (!customerId) return null;
  return Customer.findById(customerId).lean();
};

const getUserById = async (userId) => {
  if (!userId) return null;
  return User.findById(userId).lean();
};

const normalizeQuotePayload = async (payload = {}, currentQuote = null) => {
  const customerId = payload.customerId || currentQuote?.customerId;
  const customer = await getCustomerById(customerId);
  const fallbackItem = currentQuote
    ? {
        boxStyle: currentQuote.parameters?.boxStyle || currentQuote.boxStyle,
        type: currentQuote.type,
        dimension: currentQuote.dimension,
        fluteType: currentQuote.parameters?.flute || currentQuote.fluteType,
        boardQuality: currentQuote.boardQuality,
        colors: currentQuote.colors,
        joints: currentQuote.joints,
        moq: currentQuote.parameters?.moq || currentQuote.moq,
        unitPrice: 0,
      }
    : {
        boxStyle: payload.boxStyle || payload.parameters?.boxStyle || "Corrugated",
        type: payload.type || "RSC",
        dimension: payload.dimension || "ID (L x W x H mm)",
        fluteType: payload.fluteType || payload.parameters?.flute || "B",
        boardQuality: payload.boardQuality || "150 GSM",
        colors: payload.colors || "2",
        joints: payload.joints || "Glue",
        moq: payload.moq || payload.parameters?.moq || "5k",
        unitPrice: 0,
      };

  const normalizedItems =
    Array.isArray(payload.items) && payload.items.length > 0
      ? payload.items.map((item) => sanitizeQuoteItem(item, fallbackItem))
      : currentQuote?.items?.length
        ? currentQuote.items.map((item) => sanitizeQuoteItem(item, fallbackItem))
        : [sanitizeQuoteItem({}, fallbackItem)];

  const leadItem = normalizedItems[0];
  const totalPlaceholder =
    payload.totalPlaceholder ??
    normalizedItems.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
      0
    );

  return {
    customerId,
    customer,
    clientDetails: sanitizeClientDetails(payload.clientDetails || currentQuote?.clientDetails || {}, customer),
    items: normalizedItems,
    leadItem,
    totalPlaceholder,
    status: payload.status || currentQuote?.status || "Draft",
  };
};

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
  const normalizedPayload = await normalizeQuotePayload(payload);
  const createdBy = payload.createdBy;
  const initialNote =
    payload.note ||
    (normalizedPayload.status === "Pending"
      ? "Quote submitted for HOD approval"
      : "Quote created");
  const creator = await getUserById(createdBy);

  const quote = await Quote.create({
    quoteNumber: payload.quoteNumber,
    customerId: normalizedPayload.customerId,
    clientDetails: normalizedPayload.clientDetails,
    status: normalizedPayload.status,
    parameters: {
      boxStyle: normalizedPayload.leadItem.boxStyle,
      flute: normalizedPayload.leadItem.fluteType,
      moq: normalizedPayload.leadItem.moq,
    },
    type: normalizedPayload.leadItem.type,
    dimension: normalizedPayload.leadItem.dimension,
    boardQuality: normalizedPayload.leadItem.boardQuality,
    colors: normalizedPayload.leadItem.colors,
    joints: normalizedPayload.leadItem.joints,
    items: normalizedPayload.items,
    totalPlaceholder: normalizedPayload.totalPlaceholder,
    createdBy,
    history: [
      buildStatusHistoryEntry({
        status: normalizedPayload.status,
        updatedBy: createdBy,
        note: initialNote,
      }),
    ],
    approvalHistory: [
      buildApprovalAuditEntry({
        actor: creator,
        action: normalizedPayload.status === "Pending" ? "Submitted" : "Created",
        fromStatus: normalizedPayload.status === "Pending" ? "Draft" : "",
        toStatus: normalizedPayload.status,
        note: initialNote,
      }),
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

  if (!["Draft", "AskedForEdit"].includes(quote.status)) {
    const error = new Error("Only Draft or AskedForEdit quotes can be edited by Sales");
    error.statusCode = 409;
    throw error;
  }

  const normalizedPayload = await normalizeQuotePayload(payload, quote);

  quote.customerId = normalizedPayload.customerId;
  quote.clientDetails = normalizedPayload.clientDetails;
  quote.parameters = {
    ...quote.parameters,
    boxStyle: normalizedPayload.leadItem.boxStyle,
    flute: normalizedPayload.leadItem.fluteType,
    moq: normalizedPayload.leadItem.moq,
  };
  quote.type = normalizedPayload.leadItem.type;
  quote.dimension = normalizedPayload.leadItem.dimension;
  quote.boardQuality = normalizedPayload.leadItem.boardQuality;
  quote.colors = normalizedPayload.leadItem.colors;
  quote.joints = normalizedPayload.leadItem.joints;
  quote.items = normalizedPayload.items;
  quote.totalPlaceholder = normalizedPayload.totalPlaceholder;

  const previousStatus = quote.status;

  if (payload.status) {
    quote.status = payload.status;
  }

  if (payload.status && payload.updatedBy) {
    quote.history.push(
      buildStatusHistoryEntry({
        status: payload.status,
        updatedBy: payload.updatedBy,
        note: payload.note || "",
      })
    );

    const actor = await getUserById(payload.updatedBy);
    quote.approvalHistory.push(
      buildApprovalAuditEntry({
        actor,
        action: payload.status === "Pending" ? "Submitted" : "Edited",
        fromStatus: previousStatus,
        toStatus: payload.status,
        note: payload.note || "",
      })
    );
  }

  await quote.save();

  const updatedQuote = await populateQuoteQuery(Quote.findById(quote._id));
  return mapQuoteToClientDTO(updatedQuote);
};

const updateQuoteStatus = async (quoteId, payload) => {
  const quote = await Quote.findById(quoteId);

  if (!quote) {
    return null;
  }

  const actor =
    payload.actor ||
    (payload.actorId ? await getUserById(payload.actorId) : null);
  const transition = getApprovalTransition({
    actorRole: actor?.role || payload.actorRole,
    currentStatus: quote.status,
    action: payload.action,
  });

  const fromStatus = quote.status;
  const toStatus = transition.nextStatus;

  quote.status = toStatus;
  quote.history.push(
    buildStatusHistoryEntry({
        status: toStatus,
        updatedBy: actor?.id || actor?._id,
        note:
          payload.note ||
          `${transition.actionLabel} by ${actor?.role || payload.actorRole || "approver"}.`,
      })
    );
  quote.approvalHistory.push(
    buildApprovalAuditEntry({
      actor,
      action:
        transition.action === APPROVAL_ACTIONS.APPROVE
          ? "Approved"
          : "Sent Back",
      fromStatus,
      toStatus,
      note:
        payload.note ||
        `${transition.actionLabel} and moved to ${transition.destinationLabel}.`,
    })
  );

  await quote.save();

  const updatedQuote = await populateQuoteQuery(Quote.findById(quote._id));
  return mapQuoteToClientDTO(updatedQuote);
};

module.exports = {
  getQuotes,
  getQuoteById,
  createQuote,
  updateQuote,
  updateQuoteStatus,
};
