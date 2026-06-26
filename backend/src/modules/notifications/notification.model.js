const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    quoteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quote",
      required: true,
    },
    quoteNumber: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["approval_status_change"],
      default: "approval_status_change",
      required: true,
    },
    targetRoles: [
      {
        type: String,
        enum: ["Sales", "HOD", "SC_HEAD", "GM", "Planning"],
        required: true,
      },
    ],
    actorName: {
      type: String,
      trim: true,
      default: "",
    },
    actorRole: {
      type: String,
      trim: true,
      default: "",
    },
    action: {
      type: String,
      trim: true,
      required: true,
    },
    fromStatus: {
      type: String,
      trim: true,
      default: "",
    },
    toStatus: {
      type: String,
      trim: true,
      default: "",
    },
    reason: {
      type: String,
      trim: true,
      default: "",
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    readBy: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
