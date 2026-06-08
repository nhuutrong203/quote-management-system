const express = require("express");

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    status: "OKAY",
    message: "Backend service is running",
    service: "quote-management-backend",
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;