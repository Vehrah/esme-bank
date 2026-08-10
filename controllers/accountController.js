const Account = require("../models/Account");
const User = require("../models/User");
const { createAccount, generateToken } = require("../services/nibssService");
const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");

exports.getAccount = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });

    const account = await Account.findOne({ user: user._id });

    if (!account) {
      return res.status(404).json({
        message: "Account not found"
      });
    }

    res.json({
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      },
      account
    });

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

exports.createAccount = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });

    // Ensure 1 account only
    const existing = await Account.findOne({ email: user.email });
    if (existing) {
      return res.status(400).json({ message: "User already has account" });
    }

    console.log(user)
    const token= await generateToken({
      apiKey: process.env.API_KEY,
      apiSecret: process.env.API_SECRET
    });

    console.log(token)
    // 🔹 Call NIBSS
    const nibssAccount = await createAccount({
      kycType: "bvn",
      kycID: user.bvn,
      dob: user.dob

    }, token);

    console.log(nibssAccount)

    const account = await Account.create({
      user: user._id,
      accountNumber: nibssAccount.accountNumber,
      balance: nibssAccount.balance
    });

    res.json(account);
  } catch (err) {
    res.status(500).json(err.message);
  }
};
//           getprofile       //

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    res.json(user);
  } catch (err) {
    res.status(500).json({
      message: "Unable to load profile",
    });
  }
};

// ================= UPGRADE ACCOUNT TIER =================

exports.upgradeAccountTier = async (req, res) => {
  try {
    const { tier } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    const currentTier = user.accountTier || "Basic";

    // Upgrade prices in USD
    const tierPrices = {
      Gold: 10,
      Platinum: 25,
    };

    // Tier levels
    const tierLevel = {
      Basic: 1,
      Gold: 2,
      Platinum: 3,
    };

    // Only Gold and Platinum can be requested
    if (!["Gold", "Platinum"].includes(tier)) {
      return res.status(400).json({
        message: "Invalid upgrade tier.",
      });
    }

    // User can only move to the next tier
    if (tierLevel[tier] !== tierLevel[currentTier] + 1) {
      return res.status(400).json({
        message: `You must upgrade from ${currentTier} to the next tier.`,
      });
    }

    const upgradeFee = tierPrices[tier];

    // Check available balance
    if (user.balance < upgradeFee) {
      return res.status(400).json({
        message: `Insufficient balance. You need $${upgradeFee} to upgrade to ${tier}.`,
      });
    }

    // Deduct upgrade fee
    user.balance -= upgradeFee;

    // Upgrade account tier
    user.accountTier = tier;

    await user.save();

    // Generate transaction reference
    const reference = `ESM-UPG-${Date.now()}-${crypto
      .randomBytes(3)
      .toString("hex")
      .toUpperCase()}`;

    // Save upgrade transaction
    const transaction = await Transaction.create({
      sender: user._id,
      receiver: null,
      senderAccount: user.accountNumber,
      receiverAccount: "",
      amount: upgradeFee,
      description: `Account upgraded from ${currentTier} to ${tier}`,
      type: "upgrade",
      status: "successful",
      reference,
    });

    return res.status(200).json({
      message: `Account upgraded to ${tier} successfully.`,
      accountTier: user.accountTier,
      balance: user.balance,
      amountPaid: upgradeFee,
      transaction,
    });

  } catch (err) {
    console.error("ACCOUNT TIER UPGRADE ERROR:", err);

    return res.status(500).json({
      message: "Unable to upgrade account tier.",
    });
  }
};
//   update profile     //
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;

    const user = await User.findById(req.user.id);

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phone = phone || user.phone;

    await user.save();

    res.json(user);
  } catch (err) {
    res.status(500).json({
      message: "Profile update failed",
    });
  }
};

// Update Profile Photo
exports.updateProfilePhoto = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Please select an image.",
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "esm-bank/profile-pictures",
        transformation: [
          {
            width: 500,
            height: 500,
            crop: "fill",
          },
        ],
      },
      async (error, result) => {
        if (error) {
          console.error(error);

          return res.status(500).json({
            message: "Image upload failed.",
          });
        }

        user.profilePicture = result.secure_url;

        await user.save();

        res.json({
          message: "Profile picture updated successfully.",
          profilePicture: result.secure_url,
        });
      }
    );

    streamifier
      .createReadStream(req.file.buffer)
      .pipe(uploadStream);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Something went wrong.",
    });
  }
};