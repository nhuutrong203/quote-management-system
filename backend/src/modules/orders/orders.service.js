const mockOrderForm = {
  orderId: "ORD-001",
  quoteId: "Q-001",
  customerName: "ABC Corporation",
  items: [
    {
      name: "Product A",
      quantity: 2,
      unitPrice: 500,
    },
    {
      name: "Product B",
      quantity: 1,
      unitPrice: 200,
    },
  ],
  status: "Draft",
};

const getOrderForm = () => {
  return mockOrderForm;
};

module.exports = {
  getOrderForm,
};