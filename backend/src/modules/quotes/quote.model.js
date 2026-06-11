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

    type: {
      type: String,
      trim: true,
      default: "Single Wall",
    },

    dimension: {
      type: String,
      trim: true,
      default: "40x30x30",
    },

    boardQuality: {
      type: String,
      trim: true,
      default: "N/A",
    },

    colors: {
      type: String,
      trim: true,
      default: "N/A",
    },

    joints: {
      type: String,
      trim: true,
      default: "N/A",
    },

    items: [
      {
        name: {
          type: String,
          trim: true,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 0,
        },
        unitPrice: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    totalPlaceholder: {
      type: Number,
      default: 125000,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    history: [
      {
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
          required: true,
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
        note: {
          type: String,
          trim: true,
          default: "",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Quote", quoteSchema);

