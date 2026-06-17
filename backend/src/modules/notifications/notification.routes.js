const express = require("express");
const notificationController = require("./notification.controller");
const { authenticateRequest } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.get("/", authenticateRequest, notificationController.getNotifications);

module.exports = router;
