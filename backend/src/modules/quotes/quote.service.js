const mockQuotes = [
  {
    id: "Q-001",
    customerName: "ABC Corporation",
    status: "Draft",
    totalAmount: 1200,
    createdAt: "2026-06-08",
  },
  {
    id: "Q-002",
    customerName: "GreenTech Vietnam",
    status: "Pending Approval",
    totalAmount: 3500,
    createdAt: "2026-06-08",
  },
  {
    id: "Q-003",
    customerName: "Saigon Retail Group",
    status: "Approved",
    totalAmount: 5200,
    createdAt: "2026-06-08",
  },
];

const getAllQuotes = () => {
  return mockQuotes;
};

module.exports = {
  getAllQuotes,
};