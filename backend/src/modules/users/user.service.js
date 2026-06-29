const mongoose = require("mongoose");
const User = require("./user.model");

const ALLOWED_ROLES = ["Sales", "HOD", "SC_HEAD", "GM", "Planning"];

const mockUsers = [
  {
    _id: "mock-user-sales",
    name: "Siow",
    email: "siow@amb.com.sg",
    password: "demo1234",
    role: "Sales",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "mock-user-hod",
    name: "HOD Singapore",
    email: "hod@amb.com.sg",
    password: "demo1234",
    role: "HOD",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "mock-user-schead",
    name: "SC Head Singapore",
    email: "schead@amb.com.sg",
    password: "demo1234",
    role: "SC_HEAD",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "mock-user-gm",
    name: "GM Singapore",
    email: "gm@amb.com.sg",
    password: "demo1234",
    role: "GM",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: "mock-user-planning",
    name: "Planning Singapore",
    email: "planning@amb.com.sg",
    password: "demo1234",
    role: "Planning",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const isDatabaseConnected = () => mongoose.connection.readyState === 1;

const buildAuthToken = (userId) => `mock-token-${String(userId || "")}`;

const sanitizeUser = (user) => {
  if (!user) return null;

  const userObject = user.toObject ? user.toObject() : { ...user };
  delete userObject.password;

  return userObject;
};

const getUsers = async () => {
  if (!isDatabaseConnected()) {
    return mockUsers.map(sanitizeUser);
  }

  const users = await User.find().select("-password").sort({ createdAt: -1 });
  return users;
};

const getUserById = async (userId) => {
  if (!isDatabaseConnected()) {
    const user = mockUsers.find((item) => item._id === userId);
    return sanitizeUser(user);
  }

  const user = await User.findById(userId).select("-password");
  return user;
};

const signup = async ({ name, email, password, role }) => {
  if (!name || !email || !password || !role) {
    const error = new Error("Name, email, password, and role are required");
    error.statusCode = 400;
    throw error;
  }

  if (!ALLOWED_ROLES.includes(role)) {
    const error = new Error("Invalid role");
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.toLowerCase();

  if (!isDatabaseConnected()) {
    const existingUser = mockUsers.find((item) => item.email === normalizedEmail);

    if (existingUser) {
      const error = new Error("Email already exists");
      error.statusCode = 409;
      throw error;
    }

    const mockUser = {
      _id: `mock-user-${Date.now()}`,
      name,
      email: normalizedEmail,
      password,
      role,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockUsers.push(mockUser);

    return sanitizeUser(mockUser);
  }

  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    const error = new Error("Email already exists");
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    role,
  });

  return sanitizeUser(user);
};

const login = async ({ email, password }) => {
  if (!email || !password) {
    const error = new Error("Email and password are required");
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = email.toLowerCase();

  let user;

  if (!isDatabaseConnected()) {
    user = mockUsers.find((item) => item.email === normalizedEmail);
  } else {
    user = await User.findOne({ email: normalizedEmail });
  }

  if (!user || user.password !== password) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error("User account is inactive");
    error.statusCode = 403;
    throw error;
  }

  const safeUser = sanitizeUser(user);

  return {
    user: safeUser,
    token: buildAuthToken(safeUser._id || safeUser.id),
  };
};

const updateUser = async (userId, updatedFields) => {
  if (updatedFields.role && !ALLOWED_ROLES.includes(updatedFields.role)) {
    const error = new Error("Invalid role");
    error.statusCode = 400;
    throw error;
  }

  if (!isDatabaseConnected()) {
    const index = mockUsers.findIndex((item) => String(item._id) === String(userId));
    if (index === -1) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
    mockUsers[index] = {
      ...mockUsers[index],
      ...updatedFields,
      updatedAt: new Date(),
    };
    return sanitizeUser(mockUsers[index]);
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  Object.assign(user, updatedFields);
  await user.save();
  return sanitizeUser(user);
};

const deleteUser = async (userId) => {
  if (!isDatabaseConnected()) {
    const index = mockUsers.findIndex((item) => String(item._id) === String(userId));
    if (index === -1) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }
    mockUsers.splice(index, 1);
    return { success: true };
  }

  const result = await User.findByIdAndDelete(userId);
  if (!result) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  return { success: true };
};

module.exports = {
  getUsers,
  getUserById,
  signup,
  login,
  buildAuthToken,
  updateUser,
  deleteUser,
};
