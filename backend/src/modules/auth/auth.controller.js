const userService = require("../users/user.service");

const signup = async (req, res, next) => {
  try {
    const user = await userService.signup(req.body);

    res.status(201).json({
      status: "OK",
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const authResult = await userService.login(req.body);

    res.status(200).json({
      status: "OK",
      message: "Login successful",
      data: authResult,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
};