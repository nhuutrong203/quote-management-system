const mockUsers = require("./mockUsers");

const login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  const user = mockUsers.find(
    (item) =>
      item.email.toLowerCase() === email.toLowerCase() &&
      item.password === password
  );

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  const { password: _, ...safeUser } = user;

  return res.status(200).json({
    success: true,
    message: "Login successful",
    user: safeUser,
    token: `mock-token-${safeUser.role.toLowerCase()}`,
  });
};

const getMockUsers = (req, res) => {
  const users = mockUsers.map(({ password, ...safeUser }) => safeUser);

  return res.status(200).json({
    success: true,
    users,
  });
};

module.exports = {
  login,
  getMockUsers,
};