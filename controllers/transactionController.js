const Transaction = require("../models/Transaction");
const User = require("../models/User");
const crypto = require("crypto");
const createNotification = require("../utils/createNotification");
const ACCOUNT_TIER_LIMITS = require("../utils/accountTierLimits");

const {
  getBanks,
  checkBalance,
  checkTransactionStatus,
} = require("../services/nibssService");

// ================= GET BANKS =================
exports.getBanks = async (req, res) => {
  try {
    const banks = await getBanks();

    res.json(banks);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};
// ================= NAME ENQUIRY =================

exports.getAccountName = async (req, res) => {
  try {
    const { accountNumber } = req.params;

    const user = await User.findOne({ accountNumber });

    if (!user) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    return res.status(200).json({
      accountName: `${user.firstName} ${user.lastName}`,
      accountNumber: user.accountNumber,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Name enquiry failed",
    });
  }
};

// ================= TRANSFER =================

exports.transfer = async (req, res) => {
  try {
    const { to, amount, description } = req.body;

    const transferAmount = Number(amount);

    // Find sender
    const sender = await User.findOne({
      email: req.user.email,
    });

    if (!sender) {
      return res.status(404).json({
        message: "Sender not found.",
      });
    }

    // Check frozen account
    if (sender.isFrozen) {
      return res.status(403).json({
        message: "Account is frozen.",
      });
    }

    // Validate recipient account
    if (!to) {
      return res.status(400).json({
        message: "Recipient account number is required.",
      });
    }

    // Prevent self-transfer
    if (sender.accountNumber === to) {
      return res.status(400).json({
        message: "You cannot transfer to your own account.",
      });
    }

    // Find receiver
    const receiver = await User.findOne({
      accountNumber: to,
    });

    if (!receiver) {
      return res.status(404).json({
        message: "Recipient account not found.",
      });
    }

    // Validate amount
    if (
      !Number.isFinite(transferAmount) ||
      transferAmount <= 0
    ) {
      return res.status(400).json({
        message: "Please enter a valid transfer amount.",
      });
    }

    // Get sender's tier limits
    const limits =
      ACCOUNT_TIER_LIMITS[sender.accountTier || "Basic"];

    // ================= DAILY TRANSFER LIMIT =================

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const dailyTransfers =
      await Transaction.aggregate([
        {
          $match: {
            sender: sender._id,
            type: "transfer",
            status: "successful",
            createdAt: {
              $gte: startOfDay,
              $lte: endOfDay,
            },
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$amount",
            },
          },
        },
      ]);

    const transferredToday =
      dailyTransfers[0]?.total || 0;

    // Check daily transfer limit
    if (
      transferredToday + transferAmount >
      limits.dailyTransfer
    ) {
      const remaining =
        limits.dailyTransfer - transferredToday;

      return res.status(400).json({
        message: `Your ${sender.accountTier} account has a daily transfer limit of $${limits.dailyTransfer.toLocaleString()}. You can transfer only $${Math.max(
          remaining,
          0
        ).toLocaleString()} more today.`,
      });
    }

    // ================= BALANCE CHECK =================

    if (sender.balance < transferAmount) {
      return res.status(400).json({
        message: "Insufficient balance.",
      });
    }

    // ================= UPDATE BALANCES =================

    sender.balance -= transferAmount;
    receiver.balance += transferAmount;

    await sender.save();
    await receiver.save();

    // ================= TRANSACTION REFERENCE =================

    const today = new Date();

    const date =
      today.getFullYear().toString().slice(-2) +
      String(today.getMonth() + 1).padStart(2, "0") +
      String(today.getDate()).padStart(2, "0");

    const reference =
      `ESM${date}${crypto
        .randomBytes(4)
        .toString("hex")
        .toUpperCase()}`;

    // ================= SAVE TRANSACTION =================

    const transaction = await Transaction.create({
      sender: sender._id,
      receiver: receiver._id,
      senderAccount: sender.accountNumber,
      receiverAccount: receiver.accountNumber,
      amount: transferAmount,
      description: description || "",
      type: "transfer",
      status: "successful",
      reference,
    });

    // ================= NOTIFICATIONS =================

    await createNotification(
      sender._id,
      "Transfer Successful",
      `You transferred $${transferAmount.toLocaleString()} to ${receiver.firstName} ${receiver.lastName}.`,
      "transfer"
    );

    await createNotification(
      receiver._id,
      "Money Received",
      `You received $${transferAmount.toLocaleString()} from ${sender.firstName} ${sender.lastName}.`,
      "transfer"
    );

    // ================= RESPONSE =================

    return res.status(200).json({
      message: "Transfer successful.",
      transaction,
      balance: sender.balance,
      accountTier: sender.accountTier,
    });

  } catch (error) {
    console.error("TRANSFER ERROR:", error);

    return res.status(500).json({
      message: "Transfer failed.",
    });
  }
};

// ================= DEPOSIT =================

exports.deposit = async (req, res) => {
  try {
    const depositAmount = Number(req.body.amount);

    const user = await User.findOne({
      email: req.user.email,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    // Account frozen check
    if (user.isFrozen) {
      return res.status(403).json({
        message: "Account is frozen.",
      });
    }

    // Validate amount
    if (
      !Number.isFinite(depositAmount) ||
      depositAmount <= 0
    ) {
      return res.status(400).json({
        message: "Please enter a valid deposit amount.",
      });
    }

    // Get limits for user's account tier
    const limits =
      ACCOUNT_TIER_LIMITS[user.accountTier || "Basic"];

    // ================= DAILY DEPOSIT LIMIT =================

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const dailyDeposits = await Transaction.aggregate([
      {
        $match: {
          receiver: user._id,
          type: "deposit",
          status: "successful",
          createdAt: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: "$amount",
          },
        },
      },
    ]);

    const depositedToday =
      dailyDeposits[0]?.total || 0;

    // Check daily deposit limit
    if (
      depositedToday + depositAmount >
      limits.dailyDeposit
    ) {
      const remaining =
        limits.dailyDeposit - depositedToday;

      return res.status(400).json({
        message: `Your ${user.accountTier} account has a daily deposit limit of $${limits.dailyDeposit.toLocaleString()}. You can deposit only $${Math.max(
          remaining,
          0
        ).toLocaleString()} more today.`,
      });
    }

    // ================= MAXIMUM BALANCE =================

    if (
      user.balance + depositAmount >
      limits.maxBalance
    ) {
      const remainingBalance =
        limits.maxBalance - user.balance;

      return res.status(400).json({
        message: `Your ${user.accountTier} account can have a maximum balance of $${limits.maxBalance.toLocaleString()}. You can deposit only $${Math.max(
          remainingBalance,
          0
        ).toLocaleString()} more.`,
      });
    }

    // ================= UPDATE BALANCE =================

    user.balance += depositAmount;

    await user.save();

    // ================= TRANSACTION REFERENCE =================

    const reference = `DEP-${Date.now()}-${Math.floor(
      100000 + Math.random() * 900000
    )}`;

    // ================= SAVE TRANSACTION =================

    await Transaction.create({
      sender: user._id,
      receiver: user._id,
      senderAccount: user.accountNumber,
      receiverAccount: user.accountNumber,
      amount: depositAmount,
      description: "Cash Deposit",
      type: "deposit",
      status: "successful",
      reference,
    });

    return res.status(200).json({
      message: "Deposit successful.",
      balance: user.balance,
      reference,
      accountTier: user.accountTier,
    });

  } catch (error) {
    console.error("Deposit Error:", error);

    return res.status(500).json({
      message: "Deposit failed.",
    });
  }
};

// ================= WITHDRAW =================

exports.withdraw = async (req, res) => {
  try {
    const { amount } = req.body;

    // Find logged-in user
    const user = await User.findOne({
      email: req.user.email,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    // Convert amount to number
    const withdrawAmount = Number(amount);

    // Validate amount
    if (
      amount === undefined ||
      amount === null ||
      amount === "" ||
      !Number.isFinite(withdrawAmount) ||
      withdrawAmount <= 0
    ) {
      return res.status(400).json({
        message: "Please enter a valid amount.",
      });
    }

    // Check if account is frozen
    if (user.isFrozen) {
      return res.status(403).json({
        message: "Account is frozen.",
      });
    }

    // Get limits for user's account tier
    const limits =
      ACCOUNT_TIER_LIMITS[user.accountTier || "Basic"];

    // ================= DAILY WITHDRAWAL LIMIT =================

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const dailyWithdrawals =
      await Transaction.aggregate([
        {
          $match: {
            sender: user._id,
            type: "withdrawal",
            status: "successful",
            createdAt: {
              $gte: startOfDay,
              $lte: endOfDay,
            },
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$amount",
            },
          },
        },
      ]);

    const withdrawnToday =
      dailyWithdrawals[0]?.total || 0;

    // Check daily withdrawal limit
    if (
      withdrawnToday + withdrawAmount >
      limits.dailyWithdrawal
    ) {
      const remaining =
        limits.dailyWithdrawal - withdrawnToday;

      return res.status(400).json({
        message: `Your ${user.accountTier} account has a daily withdrawal limit of $${limits.dailyWithdrawal.toLocaleString()}. You can withdraw only $${Math.max(
          remaining,
          0
        ).toLocaleString()} more today.`,
      });
    }

    // ================= BALANCE CHECK =================

    if (withdrawAmount > user.balance) {
      return res.status(400).json({
        message: "Insufficient balance.",
      });
    }

    // ================= DEDUCT BALANCE =================

    user.balance -= withdrawAmount;

    await user.save();

    // ================= TRANSACTION REFERENCE =================

    const reference =
      "WTH" +
      Date.now() +
      Math.floor(Math.random() * 1000);

    // ================= SAVE TRANSACTION =================

    await Transaction.create({
      sender: user._id,
      receiver: user._id,

      senderAccount: user.accountNumber,
      receiverAccount: user.accountNumber,

      amount: withdrawAmount,

      description: "Cash Withdrawal",

      type: "withdrawal",

      status: "successful",

      reference,
    });

    // ================= RESPONSE =================

    return res.status(200).json({
      message: "Withdrawal successful.",
      balance: user.balance,
      amount: withdrawAmount,
      reference,
      accountTier: user.accountTier,
    });

  } catch (error) {
    console.error("WITHDRAW ERROR:", error);

    return res.status(500).json({
      message: "Withdrawal failed.",
    });
  }
};

// ================= TRANSACTION HISTORY =================

exports.getHistory = async (req, res) => {
  try {
    const user = await User.findOne({
      email: req.user.email,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const transactions = await Transaction.find({
      $or: [
        { sender: user._id },
        { receiver: user._id },
      ],
    })
      .sort({ createdAt: -1 })
      .populate("sender", "firstName lastName")
      .populate("receiver", "firstName lastName");

    return res.status(200).json(transactions);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch transaction history.",
    });
  }
};

// ================= CHECK BALANCE =================

exports.checkBalance = async (req, res) => {
  try {
    const user = await User.findOne({
      email: req.user.email,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.accountNumber !== req.params.accountNumber) {
      return res.status(403).json({
        message: "Unauthorized",
      });
    }

    const nibssToken = await generateToken({
      apiKey: process.env.API_KEY,
      apiSecret: process.env.API_SECRET,
    });

    const result = await checkBalance(
      user.accountNumber,
      nibssToken
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Check balance failed",
    });
  }
};

// ================= CHECK TRANSACTION STATUS =================

exports.checkTransactionStatus = async (req, res) => {
  try {
    const { ref } = req.params;

    const transaction = await Transaction.findOne({
      reference: ref,
    });

    if (!transaction) {
      return res.status(404).json({
        message: "Transaction not found.",
      });
    }

    const nibssToken = await generateToken({
      apiKey: process.env.API_KEY,
      apiSecret: process.env.API_SECRET,
    });

    const result = await checkTransactionStatus(
      ref,
      nibssToken
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Check transaction status failed.",
    });
  }
};