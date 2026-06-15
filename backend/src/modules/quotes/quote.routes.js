const express = require("express");
const quoteController = require("./quote.controller");
const { authenticateRequest, requireRoles } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.get("/", quoteController.getQuotes);
router.get("/:id", quoteController.getQuoteById);
router.post("/", quoteController.createQuote);
router.patch(
  "/:id/status",
  authenticateRequest,
  requireRoles("HOD", "SC_HEAD", "GM"),
  quoteController.patchQuoteStatus
);
router.put("/:id", quoteController.updateQuote);

module.exports = router;
