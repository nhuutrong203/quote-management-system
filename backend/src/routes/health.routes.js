const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "AMB backend is running",
    service: "quote-management-backend",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;