const orderService = require("./order.service");

const getOrderForm = (req, res) => {
  const orderForm = orderService.getOrderForm();

  res.status(200).json({
    status: "OKAY",
    message: "Order form fetched successfully",
    data: orderForm,
  });
};

module.exports = {
  getOrderForm,
};