const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String,
  bvn: String,
  nin: String,
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },

  accountNumber: {
    type: String,
    unique: true,
  },
   bankCode: {
      type: String,
      default: "282",
    },
  balance: {
    type: Number,
    default: 15000,
  },
      accountTier: {
      type: String,
      enum: ["Basic", "Silver", "Gold", "Platinum"],
      default: "Basic",
    },

  currency: {
    type: String,
    default: "USD",
  },
   isFrozen: {
    type: Boolean,
    default: false,
  },
  dob: Date,
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },

  verificationToken: String,
  verificationTokenExpires: Date,

  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

module.exports = mongoose.model("User", userSchema);