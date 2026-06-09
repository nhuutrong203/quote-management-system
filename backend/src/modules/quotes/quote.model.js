const mongoose = require("mongoose");

const quoteSchema = new mongoose.Schema(
  {
    quoteNumber: {  // ma~ quote: Q-0001, Q-0002, ...
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    status: {
      type: String,
      enum: [
        "Draft",
        "Pending",
        "Processing",
        "PendingApproval",
        "Approved",
        "Rejected",
        "AskedForEdit",
      ],
      default: "Draft",
      required: true,
    },

    totalPlaceholder: {
      type: Number,
      default: 0,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Quote", quoteSchema);