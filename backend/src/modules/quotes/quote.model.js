const mongoose = require("mongoose");

const quoteItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    boxStyle: {
      type: String,
      trim: true,
      default: "Corrugated",
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
    fluteType: {
      type: String,
      trim: true,
      default: "B",
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
    moq: {
      type: String,
      trim: true,
      default: "5k",
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
  { _id: false }
);

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

    clientDetails: {
      companyName: {
        type: String,
        trim: true,
        required: true,
      },
      companyAddress: {
        type: String,
        trim: true,
        required: true,
      },
      contactPerson: {
        type: String,
        trim: true,
        required: true,
      },
      phoneNumber: {
        type: String,
        trim: true,
        required: true,
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
        required: true,
      },
      billingAddress: {
        type: String,
        trim: true,
        required: true,
      },
      deliveryAddress: {
        type: String,
        trim: true,
        required: true,
      },
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

    items: [quoteItemSchema],

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

    approvalHistory: [
      {
        actorId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
        actorName: {
          type: String,
          trim: true,
          default: "",
        },
        actorEmail: {
          type: String,
          trim: true,
          lowercase: true,
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
        note: {
          type: String,
          trim: true,
          default: "",
        },
        timestamp: {
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

module.exports = mongoose.model("Quote", quoteSchema);

