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
        default: "Corrugated",
      },

      flute: {
        type: String,
        trim: true,
        default: "B",
      },

      moq: {
        type: String,
        trim: true,
        default: "5k",
      },
    },

    type: {
      type: String,
      trim: true,
      default: "RSC",
    },

    dimension: {
      type: String,
      trim: true,
      default: "ID (L x W x H mm)",
    },

    boardQuality: {
      type: String,
      trim: true,
      default: "150 GSM",
    },

    colors: {
      type: String,
      trim: true,
      default: "2",
    },

    joints: {
      type: String,
      trim: true,
      default: "Glue",
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

