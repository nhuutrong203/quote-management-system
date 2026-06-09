const express = require("express");
const { login, getMockUsers } = require("./auth.controller");
const mockAuthMiddleware = require("./auth.middleware");
const allowRoles = require("./role.middleware");

const router = express.Router();

router.post("/login", login);
router.get("/mock-users", getMockUsers);

router.get("/me", mockAuthMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

router.get(
  "/gm-only-demo",
  mockAuthMiddleware,
  allowRoles("GM"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "GM role access granted",
      user: req.user,
    });
  }
);

module.exports = router;