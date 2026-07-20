const Transaction = require("../models/Transaction");
const User = require("../models/User");

const {
  getBanks,
  nameEnquiry,
  generateToken,
  nibssTransfer,
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

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        message: "Invalid amount.",
      });
    }

    if (sender.balance < Number(amount)) {
      return res.status(400).json({
        message: "Insufficient balance.",
      });
    }

    // Generate Phoenix token
    const nibssToken = await generateToken({
      apiKey: process.env.API_KEY,
      apiSecret: process.env.API_SECRET,
    });

    // Send transfer to Phoenix
    const transferResult = await nibssTransfer(
      {
        from: sender.accountNumber,
        to,
        amount: Number(amount),
      },
      nibssToken
    );

    if (!transferResult) {
      return res.status(400).json({
        message: "Transfer failed.",
      });
    }

    // Debit sender locally
    sender.balance -= Number(amount);

    await sender.save();

    // Save transaction locally
    const transaction = await Transaction.create({
      sender: sender._id,
      receiver: null,
      senderAccount: sender.accountNumber,
      receiverAccount: to,
      amount: Number(amount),
      description,
      type: "transfer",
      status: "successful",
      reference:
        transferResult.reference ||
        transferResult.ref ||
        ("RIA" + Date.now()),
    });

    return res.status(200).json({
      message: "Transfer successful",

      balance: sender.balance,

      reference:
        transaction.reference,

      transaction,

      nibss: transferResult,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message:
        error.response?.data?.message ||
        "Transfer failed",
    });
  }
};

// ================= DEPOSIT =================

exports.deposit = async (req, res) => {
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
     if (user.isFrozen) {
    return res.status(403).json({
        message: "Account is frozen."
    });
}
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        message: "Please enter a valid amount.",
      });
    }

    user.balance += Number(amount);

    await user.save();

    const reference =
      "DEP" +
      Date.now() +
      Math.floor(Math.random() * 1000);

    await Transaction.create({
      sender: user._id,
      receiver: user._id,
      senderAccount: user.accountNumber,
      receiverAccount: user.accountNumber,
      amount: Number(amount),
      description: "Cash Deposit",
      type: "deposit",
      status: "successful",
      reference,
    });

    return res.status(200).json({
      message: "Deposit successful",
      balance: user.balance,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Deposit failed",
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

    user.balance -= Number(amount);

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