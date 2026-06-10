const mongoose = require("mongoose");

const quoteSchema = new mongoose.Schema(
  {
    quoteNumber: {
      // ma~ quote: Q-0001, Q-0002, ...
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

    parameters: {
      boxStyle: {
        type: String,
        trim: true,
        default: "N/A",
      },

      flute: {
        type: String,
        trim: true,
        default: "N/A",
      },

      moq: {
        type: String,
        trim: true,
        default: "N/A",
      },
    },

    totalPlaceholder: {
      type: Number,
      default: 125000,
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


// 6a297646fa510a08a4f30bb4\
// 6a297647fa510a08a4f30bb8