const ordersService = require("./orders.service");

const getOrderForm = (req, res) => {
  const orderForm = ordersService.getOrderForm();

  res.status(200).json({
    status: "OKAY",
    message: "Order form fetched successfully",
    data: orderForm,
  });
};

module.exports = {
  getOrderForm,
};