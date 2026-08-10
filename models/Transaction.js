const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    senderAccount: {
      type: String,
      required: true,
    },

    receiverAccount: {
      type: String,
      default: "",
    },

    amount: {
      type: Number,
      required: true,
      min: 1,
    },

    description: {
      type: String,
      default: "",
    },

    type: {
      type: String,
      enum: [
        "transfer",
        "deposit",
        "withdrawal",
        "upgrade",
      ],
      default: "transfer",
    },

    status: {
      type: String,
      enum: [
        "pending",
        "successful",
        "failed",
      ],
      default: "successful",
    },

    reference: {
      type: String,
      unique: true,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Transaction",
  transactionSchema
);