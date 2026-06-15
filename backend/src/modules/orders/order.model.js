const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    quoteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quote",
      required: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    status: {
      type: String,
      enum: ["Draft", "Submitted", "Processing", "Completed", "Cancelled"],
      default: "Draft",
      required: true,
    },

    orderDetails: {
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
    },

    orderDetailsRows: [
      {
        boxStyle: { type: String, trim: true, default: "Corrugated" },
        type: { type: String, trim: true, default: "RSC" },
        dimension: { type: String, trim: true, default: "ID (L x W x H mm)" },
        fluteType: { type: String, trim: true, default: "B" },
        boardQuality: { type: String, trim: true, default: "150 GSM" },
        colors: { type: String, trim: true, default: "2" },
        joints: { type: String, trim: true, default: "Glue" },
        moq: { type: String, trim: true, default: "5k" },
      },
    ],

    quoteTotalLabel: {
      type: String,
      trim: true,
      default: "S$125,000",
    },

    customerSnapshot: {
      companyName: {
        type: String,
        trim: true,
        default: "",
      },
      contactName: {
        type: String,
        trim: true,
        default: "",
      },
      email: {
        type: String,
        trim: true,
        default: "",
      },
      phone: {
        type: String,
        trim: true,
        default: "",
      },
      address: {
        type: String,
        trim: true,
        default: "",
      },
      billingAddress: {
        type: String,
        trim: true,
        default: "",
      },
      deliveryAddress: {
        type: String,
        trim: true,
        default: "",
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
