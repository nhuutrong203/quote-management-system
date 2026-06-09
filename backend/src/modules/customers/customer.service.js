const Customer = require("./customer.model");

const getCustomers = async () => {
  const customers = await Customer.find().sort({ createdAt: -1 });
  return customers;
};

const getCustomerById = async (customerId) => {
  const customer = await Customer.findById(customerId);
  return customer;
};

module.exports = {
  getCustomers,
  getCustomerById,
};
