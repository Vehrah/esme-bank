const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");

const {
  getBanks,
  getAccountName,
  transfer,
  getHistory,
  checkBalance,
  checkTransactionStatus,
  deposit,
  withdraw,
} = require("../controllers/transactionController");

// Get all banks
router.get("/accounts", auth, getBanks);

// Name enquiry
router.get(
  "/name-enquiry/:accountNumber",
  auth,
  getAccountName
);

// Transfer
router.post("/transfer", auth, transfer);

// Deposit
router.post("/deposit", auth, deposit);

// Withdraw
router.post("/withdraw", auth, withdraw);

// Transaction history
router.get("/history", auth, getHistory);

// Balance
router.get("/balance/:accountNumber", auth, checkBalance);

// Transaction status
router.get("/status/:ref", auth, checkTransactionStatus);

module.exports = router;