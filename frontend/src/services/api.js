import axios from "axios";
import { MOCK_USERS, MOCK_CUSTOMERS, MOCK_QUOTE_SETUP, INITIAL_QUOTES } from "./mockData";

const API_URL = "http://localhost:5000/api";

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

// Initialize localStorage if empty
const getStoredQuotes = () => {
  const stored = localStorage.getItem("quotes");
  if (!stored) {
    localStorage.setItem("quotes", JSON.stringify(INITIAL_QUOTES));
    return INITIAL_QUOTES;
  }
  return JSON.parse(stored);
};

const setStoredQuotes = (quotes) => {
  localStorage.setItem("quotes", JSON.stringify(quotes));
};

const getStoredUsers = () => {
  const stored = localStorage.getItem("users");
  if (!stored) {
    localStorage.setItem("users", JSON.stringify(MOCK_USERS));
    return MOCK_USERS;
  }
  return JSON.parse(stored);
};

const setStoredUsers = (users) => {
  localStorage.setItem("users", JSON.stringify(users));
};

export const apiService = {
  // Authentication
  login: async (email, password) => {
    try {
      return await axiosInstance.post("/auth/login", { email, password });
    } catch (err) {
      // Fallback for mock environment if backend auth routes are not implemented yet (404)
      if (err.response && err.response.status === 404) {
        const users = getStoredUsers();
        const user = users.find((u) => u.email === email);
        if (user) {
          return { data: user };
        }
        throw {
          response: {
            status: 401,
            data: { message: "Email hoặc mật khẩu không chính xác." }
          }
        };
      }
      throw err;
    }
  },

  registerUser: async (name, email, password, proposedRole) => {
    // Helper for mock registration
    const handleMockRegister = () => {
      const users = getStoredUsers();
      if (users.some((u) => u.email === email)) {
        throw {
          response: {
            status: 409,
            data: { message: "Email này đã được đăng ký." }
          }
        };
      }
      
      const newUser = {
        id: "u_" + Date.now(),
        name,
        email,
        role: proposedRole,
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(name)}`
      };
      
      users.push(newUser);
      setStoredUsers(users);
      return { data: newUser };
    };

    try {
      // Try the requested endpoint /auth/register
      return await axiosInstance.post("/auth/register", { 
        name, 
        email, 
        password, 
        proposedRole,
        role: proposedRole // backend compatibility
      });
    } catch (err) {
      if (err.response && err.response.status === 404) {
        try {
          // Fallback: try actual backend staging route /auth/signup
          return await axiosInstance.post("/auth/signup", { 
            name, 
            email, 
            password, 
            proposedRole,
            role: proposedRole // backend compatibility
          });
        } catch (subErr) {
          // If still 404, fallback to local storage mock
          if (subErr.response && subErr.response.status === 404) {
            return handleMockRegister();
          }
          throw subErr;
        }
      }
      throw err;
    }
  },

  // Users
  getUsers: async () => {
    try {
      return await axiosInstance.get("/users");
    } catch (err) {
      const users = getStoredUsers();
      return { data: users };
    }
  },

  // Customers
  getCustomers: async () => {
    return { data: MOCK_CUSTOMERS };
  },

  // Quote Config Setup
  getQuoteSetup: async () => {
    return { data: MOCK_QUOTE_SETUP };
  },

  // Quotes List
  getQuotes: async () => {
    const quotes = getStoredQuotes();
    return { data: quotes };
  },

  // Quote Details
  getQuoteById: async (id) => {
    const quotes = getStoredQuotes();
    const quote = quotes.find((q) => q.id === id);
    return { data: quote || null };
  },

  // Create Quote
  createQuote: async (payload) => {
    const quotes = getStoredQuotes();
    
    // Find creator user detail
    const users = getStoredUsers();
    const creator = users.find((u) => u.id === payload.createdBy || u.role === "Sales") || users[0];
    // Find customer detail
    const customer = MOCK_CUSTOMERS.find((c) => c.id === payload.customerId) || MOCK_CUSTOMERS[0];

    const newQuote = {
      id: "q_" + Date.now(),
      quoteNumber: payload.quoteNumber || `Q-2026-${String(quotes.length + 1).padStart(4, "0")}`,
      customer: customer,
      status: payload.status || "Draft",
      items: payload.items || [],
      createdBy: creator,
      createdAt: new Date().toISOString(),
      history: [
        {
          status: payload.status || "Draft",
          updatedBy: creator,
          updatedAt: new Date().toISOString(),
          note: payload.status === "PendingApproval" ? "Gửi yêu cầu phê duyệt" : "Khởi tạo báo giá nháp"
        }
      ]
    };

    quotes.unshift(newQuote);
    setStoredQuotes(quotes);
    return { data: newQuote };
  },

  // Update Quote (Status, edits, notes, history)
  updateQuote: async (id, payload) => {
    const quotes = getStoredQuotes();
    const index = quotes.findIndex((q) => q.id === id);

    if (index === -1) {
      throw new Error("Quote not found");
    }

    const currentQuote = quotes[index];
    
    // Merge new updates
    const updatedQuote = {
      ...currentQuote,
      ...payload,
      // If status changes, add to history log
      history: payload.status && payload.status !== currentQuote.status 
        ? [
            ...currentQuote.history,
            {
              status: payload.status,
              updatedBy: payload.updatedBy || currentQuote.createdBy,
              updatedAt: new Date().toISOString(),
              note: payload.note || `Chuyển trạng thái sang ${payload.status}`
            }
          ]
        : currentQuote.history
    };

    quotes[index] = updatedQuote;
    setStoredQuotes(quotes);
    return { data: updatedQuote };
  }
};

export default apiService;
