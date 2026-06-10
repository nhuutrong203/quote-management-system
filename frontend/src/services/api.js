import { MOCK_USERS, MOCK_CUSTOMERS, MOCK_QUOTE_SETUP, INITIAL_QUOTES } from "./mockData";

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

export const apiService = {
  // Users
  getUsers: async () => {
    return { data: MOCK_USERS };
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
    const creator = MOCK_USERS.find((u) => u.id === payload.createdBy || u.role === "Sales") || MOCK_USERS[0];
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
