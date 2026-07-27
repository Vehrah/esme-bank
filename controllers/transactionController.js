const Transaction = require("../models/Transaction");
const User = require("../models/User");
const crypto = require("crypto");

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

    const sender = await User.findOne({
      email: req.user.email,
    });

    if (!sender) {
      return res.status(404).json({
        message: "Sender not found",
      });
    }

    if (sender.isFrozen) {
      return res.status(403).json({
        message: "Account is frozen.",
      });
    }

    if (sender.accountNumber === to) {
      return res.status(400).json({
        message: "You cannot transfer to your own account.",
      });
    }

    const receiver = await User.findOne({
      accountNumber: to,
    });

    if (!receiver) {
      return res.status(404).json({
        message: "Recipient account not found.",
      });
    }

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        message: "Invalid amount.",
      });
    }
        if (transferAmount > 5000000) {
      return res.status(400).json({
        message: "Maximum transfer is ₦5,000,000.",
      });
    }

    if (sender.balance < Number(amount)) {
      return res.status(400).json({
        message: "Insufficient balance.",
      });
    }

    // Update balances
    sender.balance -= Number(amount);
    receiver.balance += Number(amount);

    await sender.save();
    await receiver.save();

    // Generate transaction reference
        const today = new Date();

const date =
  today.getFullYear().toString().slice(-2) +
  String(today.getMonth() + 1).padStart(2, "0") +
  String(today.getDate()).padStart(2, "0");

const reference =
  `ESM${date}${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    // Save transaction
    const transaction = await Transaction.create({
      sender: sender._id,
      receiver: receiver._id,
      senderAccount: sender.accountNumber,
      receiverAccount: receiver.accountNumber,
      amount: Number(amount),
      description,
      type: "transfer",
      status: "successful",
      reference,
    });

    return res.status(200).json({
      message: "Transfer successful",
      transaction,
      balance: sender.balance,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Transfer failed",
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

    if (user.isFrozen) {
      return res.status(403).json({
        message: "Account is frozen.",
      });
    }

    if (isNaN(depositAmount)) {
      return res.status(400).json({
        message: "Invalid amount.",
      });
    }

    if (depositAmount <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than zero.",
      });
    }

    // Maximum deposit limit
    if (depositAmount > 10000000) {
      return res.status(400).json({
        message: "Maximum deposit is ₦10,000,000.",
      });
    }

    // ================= ACCOUNT TIER LIMIT =================

const limits = {
  Basic: 500000,
  Silver: 2000000,
  Gold: 10000000,
  Platinum: 100000000,
};

const maxBalance = limits[user.accountTier] || 500000;

if (user.balance + depositAmount > maxBalance) {
  return res.status(400).json({
    message: `Your ${user.accountTier} account cannot exceed ₦${maxBalance.toLocaleString()}.`,
  });
}

    // Update balance
    user.balance += depositAmount;
    await user.save();

    // Generate transaction reference
    const reference = `DEP-${Date.now()}-${Math.floor(
      100000 + Math.random() * 900000
    )}`;

    // Save transaction
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

    const user = await User.findOne({
      email: req.user.email,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        message: "Please enter a valid amount.",
      });
    }
   if(withdrawAmount <=0){
    return res.status(400).json({
      message:"Amount must be greater than zero."
    });
   }

   if(withdrawAmount > 10000000){
    return res.status(400).json({
      message:"Maximum withdrawal is $5,000,000."
    });
   }

    if (user.isFrozen) {
    return res.status(403).json({
        message: "Account is frozen."
    });
}
    if (user.balance < Number(amount)) {
      return res.status(400).json({
        message: "Insufficient balance.",
      });
    }

    user.balance -= withdrawAmount;

    await user.save();

    const reference =
      "WTH" +
      Date.now() +
      Math.floor(Math.random() * 1000);

    await Transaction.create({
      sender: user._id,
      receiver: user._id,
      senderAccount: user.accountNumber,
      receiverAccount: user.accountNumber,
      amount: Number(amount),
      description: "Cash Withdrawal",
      type: "withdrawal",
      status: "successful",
      reference,
    });

    return res.status(200).json({
      message: "Withdrawal successful",
      balance: user.balance,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Withdrawal failed",
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