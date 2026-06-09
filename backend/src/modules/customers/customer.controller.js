const mongoose = require("mongoose");
const customerService = require("./customer.service");

const getCustomers = async (req, res, next) => {
  try {
    const customers = await customerService.getCustomers();

    res.status(200).json({
      status: "OK",
      message: "Customers fetched successfully",
      data: customers,
    });
  } catch (error) {
    next(error);
  }
};

const getCustomerById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        status: "FAILED",
        message: "Invalid customer id",
      });
    }

    const customer = await customerService.getCustomerById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        status: "FAILED",
        message: "Customer not found",
      });
    }

    res.status(200).json({
      status: "OK",
      message: "Customer fetched successfully",
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
};
