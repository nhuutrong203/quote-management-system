const User = require("./user.model");

const getUsers = async () => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  return users;
};

const getUserById = async (userId) => {
  const user = await User.findById(userId).select("-password");
  return user;
};

module.exports = {
  getUsers,
  getUserById,
};
