const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    cardNumber: {
      type: String,
      required: true,
      unique: true,
    },

    expiry: {
      type: String,
      required: true,
    },

    cvv: {
      type: String,
      required: true,
    },

    cardType: {
      type: String,
      default: "Virtual Debit Card",
    },

    status: {
      type: String,
      enum: ["active", "frozen"],
      default: "active",
    },

    isFrozen: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Card", cardSchema);