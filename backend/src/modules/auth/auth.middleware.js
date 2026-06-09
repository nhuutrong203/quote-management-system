const mockUsers = require("./mockUsers");

const mockAuthMiddleware = (req, res, next) => {
  const role = req.headers["x-mock-role"];

  if (!role) {
    return res.status(401).json({
      success: false,
      message: "Missing x-mock-role header",
    });
  }

  const user = mockUsers.find((item) => item.role === role);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid mock role",
    });
  }

  const { password, ...safeUser } = user;
  req.user = safeUser;

  next();
};

module.exports = mockAuthMiddleware;