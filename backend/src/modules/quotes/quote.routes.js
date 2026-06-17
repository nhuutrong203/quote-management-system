const express = require("express");
const quoteController = require("./quote.controller");
const { authenticateRequest, requireRoles } = require("../../middlewares/auth.middleware");

const router = express.Router();

router.get("/", quoteController.getQuotes);
router.get("/:id", quoteController.getQuoteById);
router.post(
  "/",
  authenticateRequest,
  requireRoles("Sales"),
  quoteController.createQuote
);
router.patch(
  "/:id/status",
  authenticateRequest,
  requireRoles("HOD", "SC_HEAD", "GM"),
  quoteController.patchQuoteStatus
);
router.put(
  "/:id",
  authenticateRequest,
  requireRoles("Sales"),
  quoteController.updateQuote
);

module.exports = router;
