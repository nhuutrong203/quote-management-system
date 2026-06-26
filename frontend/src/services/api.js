import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    try {
      const rawUser = window.localStorage.getItem("quote_user");

      if (rawUser) {
        const parsedUser = JSON.parse(rawUser);
        const token = parsedUser?.token;

        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch {
      // Ignore local storage parsing issues and send the request without auth header.
    }
  }

  return config;
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
  Planning: "Planning",
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
    token: user.token || `mock-token-${id}`,
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

const normalizeClientDetails = (clientDetails = {}, customer = null) => ({
  companyName: clientDetails.companyName || customer?.companyName || "",
  companyAddress: clientDetails.companyAddress || customer?.address || "",
  contactPerson: clientDetails.contactPerson || customer?.contactName || "",
  phoneNumber: clientDetails.phoneNumber || customer?.phone || "",
  email: clientDetails.email || customer?.email || "",
  billingAddress: clientDetails.billingAddress || clientDetails.companyAddress || customer?.address || "",
  deliveryAddress: clientDetails.deliveryAddress || clientDetails.companyAddress || customer?.address || "",
});

const formatCurrency = (value) =>
  "S$" +
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

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

const normalizeQuoteItem = (item = {}, fallback = {}) => ({
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
  moq: item.moq || fallback.moq || "5k",
  quantity:
    Number(item.quantity || 0) > 0
      ? Number(item.quantity)
      : parseMoqQuantity(item.moq || fallback.moq || "5k"),
  unitPrice: Number(item.unitPrice || fallback.unitPrice || 0),
});

const buildFallbackQuoteItems = (quote) => {
  const quantity = parseMoqQuantity(quote.moq || quote.parameters?.moq || "1");
  const amount = Number(quote.totalPlaceholder || 0);

  return [
    normalizeQuoteItem(
      {
        name: `${quote.boxStyle || quote.parameters?.boxStyle || "Corrugated"} Box Production`,
        boxStyle: quote.boxStyle || quote.parameters?.boxStyle,
        type: quote.type,
        dimension: quote.dimension,
        fluteType: quote.fluteType || quote.parameters?.flute,
        boardQuality: quote.boardQuality,
        colors: quote.colors,
        joints: quote.joints,
        moq: quote.moq || quote.parameters?.moq,
        quantity,
        unitPrice: amount > 0 ? amount / quantity : 0,
      },
      {}
    ),
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

const normalizeApprovalEntry = (entry) => ({
  actorId: entry.actorId || "",
  actorName: entry.actorName || "System",
  actorEmail: entry.actorEmail || "",
  actorRole: normalizeRole(entry.actorRole || "Sales"),
  action: entry.action || "Updated",
  fromStatus: entry.fromStatus || "",
  toStatus: entry.toStatus || "",
  note: entry.note || "",
  timestamp: entry.timestamp || new Date().toISOString(),
});

const normalizeQuote = (quote) => {
  if (!quote) return null;

  const customer = normalizeCustomer(quote.customer || quote.customerId);
  const createdBy = normalizeUser(quote.createdBy);
  const items =
    Array.isArray(quote.items) && quote.items.length > 0
      ? quote.items.map((item) =>
          normalizeQuoteItem(item, {
            boxStyle: quote.boxStyle || quote.parameters?.boxStyle,
            type: quote.type,
            dimension: quote.dimension,
            fluteType: quote.fluteType || quote.parameters?.flute,
            boardQuality: quote.boardQuality,
            colors: quote.colors,
            joints: quote.joints,
            moq: quote.moq || quote.parameters?.moq,
          })
        )
      : buildFallbackQuoteItems(quote);

  const totalPlaceholder =
    quote.totalPlaceholder ??
    items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return {
    ...quote,
    id: String(quote.id || quote._id || ""),
    quoteNumber: quote.quoteNumber,
    customer,
    customerId: customer.id,
    clientDetails: normalizeClientDetails(quote.clientDetails || {}, customer),
    status: quote.status || "Draft",
    statusLabel: quote.statusLabel || (quote.status === "Approved" ? "Active" : quote.status),
    boxStyle: items[0]?.boxStyle || quote.boxStyle || quote.parameters?.boxStyle || "Corrugated",
    type: items[0]?.type || quote.type || "RSC",
    dimension: items[0]?.dimension || quote.dimension || "ID (L x W x H mm)",
    fluteType: items[0]?.fluteType || quote.fluteType || quote.parameters?.flute || "B",
    boardQuality: items[0]?.boardQuality || quote.boardQuality || "150 GSM",
    colors: items[0]?.colors || quote.colors || "2",
    joints: items[0]?.joints || quote.joints || "Glue",
    moq: items[0]?.moq || quote.moq || quote.parameters?.moq || "5k",
    items,
    createdBy,
    createdAt: quote.createdAt || quote.creationDate || new Date().toISOString(),
    history:
      Array.isArray(quote.history) && quote.history.length > 0
        ? quote.history.map((entry) => ({
            status: entry.status,
            updatedBy: normalizeUser(entry.updatedBy),
            updatedAt: entry.updatedAt,
            note: entry.note || "",
          }))
        : buildFallbackHistory(quote),
    approvalHistory:
      Array.isArray(quote.approvalHistory) && quote.approvalHistory.length > 0
        ? quote.approvalHistory.map(normalizeApprovalEntry)
        : [],
    totalPlaceholder,
    totalDisplay: quote.totalDisplay || formatCurrency(totalPlaceholder),
  };
};

const normalizeOrderPreview = (order) => {
  if (!order) return null;

  const customer = {
    companyName: order.customer?.companyName || "Customer placeholder",
    contactName: order.customer?.contactName || "",
    email: order.customer?.email || "",
    phone: order.customer?.phone || "",
    address: order.customer?.address || "",
    billingAddress: order.customer?.billingAddress || order.customer?.address || "",
    deliveryAddress: order.customer?.deliveryAddress || order.customer?.address || "",
  };

  const orderDetailsRows =
    Array.isArray(order.orderDetailsRows) && order.orderDetailsRows.length > 0
      ? order.orderDetailsRows.map((row) => ({
          boxStyle: row.boxStyle || "Corrugated",
          type: row.type || "RSC",
          dimension: row.dimension || "ID (L x W x H mm)",
          fluteType: row.fluteType || "B",
          boardQuality: row.boardQuality || "150 GSM",
          colors: row.colors || "2",
          joints: row.joints || "Glue",
          moq: row.moq || "5000",
        }))
      : [];

  return {
    orderId: order.orderId || "ORD-12345",
    quoteId: order.quoteId || "",
    quoteNumber: order.quoteNumber || "#12345",
    status: order.status || "Draft",
    quoteTotalLabel: order.quoteTotalLabel || "S$125,000",
    customer,
    orderDetailsRows,
  };
};

const buildQuotePayload = (payload = {}) => {
  const items = Array.isArray(payload.items)
    ? payload.items.map((item) => ({
        name: item.name,
        boxStyle: item.boxStyle,
        type: item.type,
        dimension: item.dimension,
        fluteType: item.fluteType,
        boardQuality: item.boardQuality,
        colors: item.colors,
        joints: item.joints,
        moq: item.moq,
        quantity: Number(item.quantity || 0),
        unitPrice: Number(item.unitPrice || 0),
      }))
    : [];
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
    clientDetails: payload.clientDetails,
    items,
    totalPlaceholder,
    note: payload.note,
  };
};

export const normalizeStoredUser = (user) => normalizeUser(user);

export const apiService = {
  login: async (email, password) => {
    const localUsersStr = typeof window !== "undefined" ? window.localStorage.getItem("quote_system_users") : null;
    let users = [];
    if (localUsersStr) {
      try {
        users = JSON.parse(localUsersStr);
      } catch (e) {
        console.error(e);
      }
    }

    const emailLower = (email || "").trim().toLowerCase();
    
    if (users.length > 0) {
      const matchedUser = users.find((u) => (u.email || "").toLowerCase() === emailLower);
      if (!matchedUser) {
        throw {
          response: {
            status: 401,
            data: { message: "Incorrect email or password." }
          }
        };
      }
      
      if (matchedUser.password === password) {
        const normalized = normalizeUser(matchedUser);
        return {
          data: {
            status: "OK",
            message: "Login successful",
            data: {
              user: normalized,
              token: normalized.token,
            },
          },
        };
      } else {
        throw {
          response: {
            status: 401,
            data: { message: "Incorrect email or password." }
          }
        };
      }
    }

    const response = await axiosInstance.post("/auth/login", { email, password });
    const payload = unwrapResponse(response);
    const normalizedUser = normalizeUser(payload.user);

    return {
      data: {
        status: response.data?.status,
        message: response.data?.message,
        data: {
          ...payload,
          user: normalizedUser,
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
    
    const newUser = normalizeUser(unwrapResponse(response));
    
    if (typeof window !== "undefined") {
      const localUsersStr = window.localStorage.getItem("quote_system_users");
      if (localUsersStr) {
        try {
          const users = JSON.parse(localUsersStr);
          users.push({ ...newUser, password });
          window.localStorage.setItem("quote_system_users", JSON.stringify(users));
        } catch (e) {
          console.error(e);
        }
      }
    }

    return {
      data: newUser,
    };
  },

  getUsers: async () => {
    if (typeof window !== "undefined") {
      const localUsersStr = window.localStorage.getItem("quote_system_users");
      if (localUsersStr) {
        try {
          const parsed = JSON.parse(localUsersStr);
          return { data: parsed.map(normalizeUser) };
        } catch (e) {
          console.error("Error parsing local users", e);
        }
      }
    }
    
    const response = await axiosInstance.get("/users");
    const backendUsers = (unwrapResponse(response) || []).map((u) => ({
      ...normalizeUser(u),
      password: u.password || "demo1234",
    }));
    
    if (typeof window !== "undefined") {
      window.localStorage.setItem("quote_system_users", JSON.stringify(backendUsers));
    }
    
    return {
      data: backendUsers,
    };
  },

  updateUser: async (id, updatedFields) => {
    if (typeof window !== "undefined") {
      const localUsersStr = window.localStorage.getItem("quote_system_users");
      let users = [];
      if (localUsersStr) {
        try {
          users = JSON.parse(localUsersStr);
        } catch (e) {
          console.error(e);
        }
      }
      
      if (users.length === 0) {
        const response = await apiService.getUsers();
        users = response.data;
      }
      
      const updatedUsers = users.map((u) => {
        if (String(u.id) === String(id)) {
          const role = normalizeRole(updatedFields.role || u.role);
          return {
            ...u,
            ...updatedFields,
            role,
            roleLabel: getRoleLabel(role),
            avatar: updatedFields.avatar || u.avatar || buildAvatar(updatedFields),
          };
        }
        return u;
      });
      
      window.localStorage.setItem("quote_system_users", JSON.stringify(updatedUsers));
      const updatedUser = updatedUsers.find((u) => String(u.id) === String(id));
      return { data: normalizeUser(updatedUser) };
    }
    
    return { data: null };
  },

  deleteUser: async (id) => {
    if (typeof window !== "undefined") {
      const localUsersStr = window.localStorage.getItem("quote_system_users");
      let users = [];
      if (localUsersStr) {
        try {
          users = JSON.parse(localUsersStr);
        } catch (e) {
          console.error(e);
        }
      }
      
      if (users.length === 0) {
        const response = await apiService.getUsers();
        users = response.data;
      }
      
      const filteredUsers = users.filter((u) => String(u.id) !== String(id));
      window.localStorage.setItem("quote_system_users", JSON.stringify(filteredUsers));
      return { data: { success: true } };
    }
    return { data: { success: false } };
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

  getQuoteParameterOptions: async () => {
    const response = await axiosInstance.get("/quote-parameters/options");
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

  getOrderFormPreview: async (quoteId) => {
    const endpoint = quoteId ? `/orders/form/${quoteId}` : "/orders/form";
    const response = await axiosInstance.get(endpoint);
    return {
      data: normalizeOrderPreview(unwrapResponse(response)),
    };
  },

  getNotifications: async () => {
    const response = await axiosInstance.get("/notifications");
    return {
      data: unwrapResponse(response) || [],
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

  updateQuoteStatus: async (id, payload) => {
    const response = await axiosInstance.patch(`/quotes/${id}/status`, {
      action: payload.action,
      note: payload.note,
    });
    const payloadData = unwrapResponse(response);

    return {
      data: payloadData?.quote
        ? {
            quote: normalizeQuote(payloadData.quote),
            order: payloadData.order,
          }
        : normalizeQuote(payloadData),
    };
  },
};

export default apiService;
