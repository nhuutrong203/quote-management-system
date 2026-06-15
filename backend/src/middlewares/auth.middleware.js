const userService = require("../modules/users/user.service");

const TOKEN_PREFIX = "mock-token-";

const createAuthError = (message, statusCode = 401) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const extractBearerToken = (authorizationHeader = "") => {
  const [scheme, token] = String(authorizationHeader).trim().split(/\s+/);

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
};

const parseTokenUserId = (token) => {
  if (!token || !token.startsWith(TOKEN_PREFIX)) {
    return null;
  }

  return token.slice(TOKEN_PREFIX.length);
};

const authenticateRequest = async (req, res, next) => {
  try {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
      throw createAuthError("Authentication token is required");
    }

    const userId = parseTokenUserId(token);

    if (!userId) {
      throw createAuthError("Authentication token is invalid");
    }

    const user = await userService.getUserById(userId);

    if (!user) {
      throw createAuthError("Authenticated user was not found");
    }

    if (user.isActive === false) {
      throw createAuthError("Authenticated user is inactive", 403);
    }

    req.user = {
      id: String(user._id || user.id),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

const requireRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(createAuthError("Authentication is required"));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(createAuthError("You do not have permission to perform this action", 403));
  }

  return next();
};

module.exports = {
  authenticateRequest,
  requireRoles,
};
