const orderService = require("./order.service");

const getOrders = async (req, res, next) => {
  try {
    const orders = await orderService.getOrders();

    res.status(200).json({
      status: "OKAY",
      message: "Orders fetched successfully",
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

const getOrderForm = async (req, res, next) => {
  try {
    const orderForm = await orderService.getOrderForm(req.params.quoteId || req.query.quoteId);

    res.status(200).json({
      status: "OKAY",
      message: "Order form fetched successfully",
      data: orderForm,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrders,
  getOrderForm,
};
