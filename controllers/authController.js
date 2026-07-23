const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// const {
//   validateBVN,
//   generateToken,
//   createAccount,
// } = require("../services/nibssService");
const { hashPassword, comparePassword } = require("../utils/helper");
const {
  sendVerificationEmail,
  sendResetPasswordEmail,
} = require("../services/emailService");

// Generate unique 10-digit account number
const generateAccountNumber = async () => {
  let accountNumber;
  let exists = true;

  while (exists) {
    accountNumber = Math.floor(
      1000000000 + Math.random() * 9000000000
    ).toString();

    exists = await User.findOne({ accountNumber });
  }

  return accountNumber;
};


  // return {
  //   accountNumber: phoenixAccount.accountNumber,
  //   bankCode: phoenixAccount.bankCode,
  // };


// ================= REGISTER =================

exports.register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      bvn,
    } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

//     // Validate BVN
//   const bvnData = await validateBVN(bvn);

//     if (!bvnData || !bvnData.success) {
//       return res.status(400).json({
//         message: "Invalid BVN",
//       });
//     } 
//      // Generate Phoenix token
// const token = await generateToken({
//   apiKey: process.env.API_KEY,
//   apiSecret: process.env.API_SECRET,
// });

// // Create account on Phoenix
// const phoenixAccount = await createAccount(
//   {
//     kycType: "BVN",
//     kycID: bvn,
//     dob: bvnData.data.dob,
//   },
//   token
// ); 

// Validate BVN format only
if (!/^\d{11}$/.test(bvn)) {
  return res.status(400).json({
    message: "BVN must be exactly 11 digits.",
  });
}

// Generate local account number
const accountNumber = await generateAccountNumber();

const bankCode = "282";

    // Hash password
    const hashedPassword = await hashPassword(password);


    // Generate email verification token
    const verificationToken = crypto
      .randomBytes(32)
      .toString("hex");
      console.log("Generated token:", verificationToken);
    
      console.log("Generated accountNumber:", accountNumber);
        console.log("Generated bankCode:", bankCode);


              console.log({
          firstName,
          lastName,
          email,
          accountNumber,
          bankCode,
        });
    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      bvn,
      dob: null,
      accountNumber,
      bankCode,
      balance: 15000,
      currency: "USD",
      role: "user",
      verificationToken,
      verificationTokenExpires:
        Date.now() + 60 * 60 * 1000,
      isVerified: false,
    });

    // Send verification email
    // Try to send verification email
try {
  await sendVerificationEmail(
    user.email,
    verificationToken
  );
  console.log("Verification email sent successfully.");
} catch (err) {
  console.error("Email failed:", err);
}

// Always return success even if email fails
res.status(201).json({
  message:
    "Account created successfully. Please verify your email before logging in.",
  user: {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    accountNumber: user.accountNumber,
    balance: user.balance,
    currency: user.currency,
    role: user.role || "user",
  },
});
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// ================= VERIFY EMAIL =================

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: {
        $gt: Date.now(),
      },
    });

    if (!user) {
      return res.status(400).json({
        message:
          "Verification link is invalid or has expired.",
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;

    await user.save();

    res.status(200).json({
      message: "Email verified successfully.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// ================= LOGIN =================

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message:
          "Please verify your email before logging in.",
      });
    }

    const isMatch = await comparePassword(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }
     console.log("LOGIN SECRET:", process.env.JWT_SECRET);
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        bvn: user.bvn,
        accountNumber: user.accountNumber,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        bvn: user.bvn,
        accountNumber: user.accountNumber,
        balance: user.balance,
        currency: user.currency,
        role: user.role || "user",
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// ================= FORGOT PASSWORD =================

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "No account found with that email.",
      });
    }

    const resetToken = crypto
      .randomBytes(32)
      .toString("hex");

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires =
      Date.now() + 60 * 60 * 1000;

    await user.save();

    await sendResetPasswordEmail(
      user.email,
      resetToken
    );

    res.status(200).json({
      message:
        "Password reset link has been sent to your email.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// ================= RESET PASSWORD =================

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Reset link is invalid or has expired.",
      });
    }

    const hashedPassword = await hashPassword(password);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({
      message: "Password reset successful.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message,
    });
  }
};
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid admin credentials",
      });
    }

    // Only admins can use this endpoint
    if (user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied. Admins only.",
      });
    }

    // Check email verification
    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email first.",
      });
    }

    // Check password
    const isMatch = await comparePassword(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid admin credentials",
      });
    }

    // Create JWT
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.status(200).json({
      message: "Admin login successful",
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: error.message,
    });
  }
};