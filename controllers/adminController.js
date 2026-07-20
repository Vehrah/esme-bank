const User = require("../models/User");
const Transaction = require("../models/Transaction");

/* ==========================
   Dashboard
========================== */

exports.getDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    const verifiedUsers = await User.countDocuments({
      isVerified: true,
    });

    const pendingVerification = await User.countDocuments({
      isVerified: false,
    });

    const totalTransfers = await Transaction.countDocuments({
      type: "transfer",
    });

    const totalDeposits = await Transaction.aggregate([
      {
        $match: {
          type: "deposit",
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

    const totalWithdrawals = await Transaction.aggregate([
      {
        $match: {
          type: "withdrawal",
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

    const totalBalance = await User.aggregate([
      {
        $group: {
          _id: null,
          total: {
            $sum: "$balance",
          },
        },
      },
    ]);

    res.status(200).json({
      totalUsers,
      verifiedUsers,
      pendingVerification,
      totalTransfers,

      totalDeposits:
        totalDeposits.length > 0
          ? totalDeposits[0].total
          : 0,

      totalWithdrawals:
        totalWithdrawals.length > 0
          ? totalWithdrawals[0].total
          : 0,

      totalBalance:
        totalBalance.length > 0
          ? totalBalance[0].total
          : 0,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to load dashboard",
    });
  }
};

/* ==========================
   Users
========================== */

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select(
        "-password -verificationToken -verificationTokenExpires"
      )
      .sort({ createdAt: -1 });

    res.status(200).json(users);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to fetch users",
    });
  }
};

/* ==========================
   Transactions
========================== */

exports.getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("sender", "firstName lastName email")
      .populate("receiver", "firstName lastName email")
      .sort({ createdAt: -1 });

    res.status(200).json(transactions);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to fetch transactions",
    });
  }
};

/* ==========================
   Analytics
========================== */

exports.getAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    const totalTransactions =
      await Transaction.countDocuments();

    const totalDeposits = await Transaction.aggregate([
      {
        $match: {
          type: "deposit",
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

    const totalWithdrawals = await Transaction.aggregate([
      {
        $match: {
          type: "withdrawal",
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

    const totalTransfers = await Transaction.aggregate([
      {
        $match: {
          type: "transfer",
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

    const bankBalance = await User.aggregate([
      {
        $group: {
          _id: null,
          total: {
            $sum: "$balance",
          },
        },
      },
    ]);

    const successfulTransactions =
      await Transaction.countDocuments({
        status: "successful",
      });

    const failedTransactions =
      await Transaction.countDocuments({
        status: "failed",
      });

    const recentTransactions =
      await Transaction.find()
        .sort({ createdAt: -1 })
        .limit(5);

    const last7Days =
      await Transaction.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(
                Date.now() -
                  7 * 24 * 60 * 60 * 1000
              ),
            },
          },
        },
        {
          $group: {
            _id: {
              day: {
                $dateToString: {
                  format: "%a",
                  date: "$createdAt",
                },
              },
            },

            deposits: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$type", "deposit"],
                  },
                  "$amount",
                  0,
                ],
              },
            },

            withdrawals: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$type",
                      "withdrawal",
                    ],
                  },
                  "$amount",
                  0,
                ],
              },
            },

            transfers: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$type",
                      "transfer",
                    ],
                  },
                  "$amount",
                  0,
                ],
              },
            },
          },
        },
        {
          $sort: {
            "_id.day": 1,
          },
        },
      ]);

    const monthlyTrend =
      await Transaction.aggregate([
        {
          $group: {
            _id: {
              month: {
                $month: "$createdAt",
              },
            },

            deposits: {
              $sum: {
                $cond: [
                  {
                    $eq: ["$type", "deposit"],
                  },
                  "$amount",
                  0,
                ],
              },
            },

            withdrawals: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$type",
                      "withdrawal",
                    ],
                  },
                  "$amount",
                  0,
                ],
              },
            },

            transfers: {
              $sum: {
                $cond: [
                  {
                    $eq: [
                      "$type",
                      "transfer",
                    ],
                  },
                  "$amount",
                  0,
                ],
              },
            },
          },
        },
        {
          $sort: {
            "_id.month": 1,
          },
        },
      ]);

    res.status(200).json({
      totalUsers,
      totalTransactions,

      totalDeposits:
        totalDeposits.length > 0
          ? totalDeposits[0].total
          : 0,

      totalWithdrawals:
        totalWithdrawals.length > 0
          ? totalWithdrawals[0].total
          : 0,

      totalTransfers:
        totalTransfers.length > 0
          ? totalTransfers[0].total
          : 0,

      bankBalance:
        bankBalance.length > 0
          ? bankBalance[0].total
          : 0,

      successfulTransactions,
      failedTransactions,

      recentTransactions,
      last7Days,
      monthlyTrend,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to load analytics",
    });
  }
};

/* ==========================
   Freeze Account
========================== */

exports.freezeAccount = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isFrozen: true },
      { new: true }
    );

    res.status(200).json({
      message: "Account frozen successfully.",
      user,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err.message,
    });
  }
};

/* ==========================
   Unfreeze Account
========================== */

exports.unfreezeAccount = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isFrozen: false },
      { new: true }
    );

    res.status(200).json({
      message: "Account unfrozen successfully.",
      user,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err.message,
    });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await Transaction.find()
      .populate("sender", "firstName lastName email")
      .populate("receiver", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json(logs);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to fetch audit logs",
    });
  }
};