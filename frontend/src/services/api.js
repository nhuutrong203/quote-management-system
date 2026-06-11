import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const ROLE_MAP = {
  "Sales/SC": "Sales",
  "SC Head": "SC_HEAD",
};

const ROLE_LABELS = {
  Sales: "Sales/SC",
  HOD: "HOD",
  SC_HEAD: "SC Head",
  GM: "GM",
};

const unwrapResponse = (response) => response?.data?.data ?? response?.data;

const normalizeRole = (role) => ROLE_MAP[role] || role;

const getRoleLabel = (role) => ROLE_LABELS[normalizeRole(role)] || role;

const buildAvatar = (user = {}) => {
  const seed = user.email || user.name || user.id || user._id || "user";
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}`;
};

const normalizeId = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object") return value.id || value._id || null;
  return null;
};

const normalizeUser = (user) => {
  if (!user) return null;

  const role = normalizeRole(user.role);
  const id = String(user.id || user._id || "");

  return {
    ...user,
    id,
    _id: id,
    role,
    roleLabel: getRoleLabel(role),
    avatar: user.avatar || buildAvatar(user),
  };
};

const normalizeCustomer = (customer) => {
  if (!customer) {
    return {
      id: "",
      _id: "",
      companyName: "N/A",
      contactName: "",
      email: "",
      phone: "",
      address: "",
      taxCode: "",
    };
  }

  const id = String(customer.id || customer._id || "");

  return {
    ...customer,
    id,
    _id: id,
    contactName: customer.contactName || "",
    email: customer.email || "",
    phone: customer.phone || "",
    address: customer.address || "",
    taxCode: customer.taxCode || "",
  };
};

const formatCurrency = (value) =>
  "S$" +
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const buildFallbackItems = (quote) => {
  const quantity = Number(String(quote.moq || quote.parameters?.moq || "1").replace(/[^0-9.]/g, "")) || 1;
  const amount = Number(quote.totalPlaceholder || 0);

  return [
    {
      name: `${quote.boxStyle || quote.parameters?.boxStyle || "Packaging"} Box Production`,
      quantity,
      unitPrice: amount > 0 ? amount / quantity : 0,
    },
  ];
};

const buildFallbackHistory = (quote) => {
  const createdBy = normalizeUser(quote.createdBy);
  const fallbackUser =
    createdBy || {
      id: "",
      _id: "",
      name: "System",
      email: "",
      role: "Sales",
      roleLabel: "Sales/SC",
      avatar: buildAvatar({ name: "System" }),
    };
  const updatedAt = quote.updatedAt || quote.createdAt || new Date().toISOString();

  return [
    {
      status: quote.status || "Draft",
      updatedBy: fallbackUser,
      updatedAt,
      note: "Quote synchronized from backend",
    },
  ];
};

const normalizeQuote = (quote) => {
  if (!quote) return null;

  const customer = normalizeCustomer(quote.customer || quote.customerId);
  const createdBy = normalizeUser(quote.createdBy);
  const fallbackUser =
    createdBy || {
      id: "",
      _id: "",
      name: "System",
      email: "",
      role: "Sales",
      roleLabel: "Sales/SC",
      avatar: buildAvatar({ name: "System" }),
    };
  const items =
    Array.isArray(quote.items) && quote.items.length > 0
      ? quote.items.map((item) => ({
          name: item.name,
          quantity: Number(item.quantity || 0),
          unitPrice: Number(item.unitPrice || 0),
        }))
      : buildFallbackItems(quote);

  const history =
    Array.isArray(quote.history) && quote.history.length > 0
      ? quote.history.map((entry) => ({
          status: entry.status,
          updatedBy: normalizeUser(entry.updatedBy) || fallbackUser,
          updatedAt: entry.updatedAt,
          note: entry.note || "",
        }))
      : buildFallbackHistory(quote);

  const totalPlaceholder =
    quote.totalPlaceholder ??
    items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return {
    ...quote,
    id: String(quote.id || quote._id || ""),
    quoteNumber: quote.quoteNumber,
    customer,
    customerId: customer.id,
    status: quote.status || "Draft",
    statusLabel: quote.statusLabel || (quote.status === "Approved" ? "Active" : quote.status),
    boxStyle: quote.boxStyle || quote.parameters?.boxStyle || "N/A",
    type: quote.type || "Single Wall",
    dimension: quote.dimension || "40x30x30",
    fluteType: quote.fluteType || quote.parameters?.flute || "N/A",
    boardQuality: quote.boardQuality || "N/A",
    colors: quote.colors || "N/A",
    joints: quote.joints || "N/A",
    moq: quote.moq || quote.parameters?.moq || "N/A",
    items,
    createdBy,
    createdAt: quote.createdAt || quote.creationDate || new Date().toISOString(),
    history,
    totalPlaceholder,
    totalDisplay: quote.totalDisplay || formatCurrency(totalPlaceholder),
  };
};

const buildQuotePayload = (payload = {}) => {
  const items = Array.isArray(payload.items) ? payload.items : [];
  const totalPlaceholder =
    payload.totalPlaceholder ??
    items.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
      0
    );

  return {
    quoteNumber: payload.quoteNumber,
    customerId: normalizeId(payload.customerId || payload.customer),
    status: payload.status,
    createdBy: normalizeId(payload.createdBy),
    updatedBy: normalizeId(payload.updatedBy),
    boxStyle: payload.boxStyle,
    type: payload.type,
    dimension: payload.dimension,
    fluteType: payload.fluteType,
    boardQuality: payload.boardQuality,
    colors: payload.colors,
    joints: payload.joints,
    moq: payload.moq,
    items,
    totalPlaceholder,
    note: payload.note,
  };
};

export const normalizeStoredUser = (user) => normalizeUser(user);

export const apiService = {
  login: async (email, password) => {
    const response = await axiosInstance.post("/auth/login", { email, password });
    const payload = unwrapResponse(response);

    return {
      data: {
        status: response.data?.status,
        message: response.data?.message,
        data: {
          ...payload,
          user: normalizeUser(payload.user),
        },
      },
    };
  },

  registerUser: async (name, email, password, proposedRole) => {
    const response = await axiosInstance.post("/auth/signup", {
      name,
      email,
      password,
      role: normalizeRole(proposedRole),
    });

    return {
      data: normalizeUser(unwrapResponse(response)),
    };
  },

  getUsers: async () => {
    const response = await axiosInstance.get("/users");
    return {
      data: (unwrapResponse(response) || []).map(normalizeUser),
    };
  },

  getCustomers: async () => {
    const response = await axiosInstance.get("/customers");
    return {
      data: (unwrapResponse(response) || []).map(normalizeCustomer),
    };
  },

  getQuoteSetup: async () => {
    const response = await axiosInstance.get("/quote-setup");
    return {
      data: unwrapResponse(response),
    };
  },

  getQuotes: async () => {
    const response = await axiosInstance.get("/quotes");
    return {
      data: (unwrapResponse(response) || []).map(normalizeQuote),
    };
  },

  getQuoteById: async (id) => {
    const response = await axiosInstance.get(`/quotes/${id}`);
    return {
      data: normalizeQuote(unwrapResponse(response)),
    };
  },

  createQuote: async (payload) => {
    const response = await axiosInstance.post("/quotes", buildQuotePayload(payload));
    return {
      data: normalizeQuote(unwrapResponse(response)),
    };
  },

  updateQuote: async (id, payload) => {
    const response = await axiosInstance.put(`/quotes/${id}`, buildQuotePayload(payload));
    return {
      data: normalizeQuote(unwrapResponse(response)),
    };
  },
};

export default apiService;
