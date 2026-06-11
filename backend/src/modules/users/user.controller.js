const mongoose = require("mongoose");
const userService = require("./user.service");

const getUsers = async (req, res, next) => {
  try {
    const users = await userService.getUsers();

    res.status(200).json({
      status: "OK",
      message: "Users fetched successfully",
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        status: "FAILED",
        message: "Invalid user id",
      });
    }

    const user = await userService.getUserById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: "FAILED",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "OK",
      message: "User fetched successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
};