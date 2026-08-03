const Card = require("../models/Card");
const User = require("../models/User");

// Generate 16-digit card number
const generateCardNumber = () => {
  let number = "";

  for (let i = 0; i < 16; i++) {
    number += Math.floor(Math.random() * 10);
  }

  return number;
};

// Generate 3-digit CVV
const generateCVV = () => {
  return Math.floor(100 + Math.random() * 900).toString();
};

// Generate expiry (5 years)
const generateExpiry = () => {
  const today = new Date();

  const month = String(today.getMonth() + 1).padStart(2, "0");

  const year = String(today.getFullYear() + 5).slice(-2);

  return `${month}/${year}`;
};

// ================= REQUEST CARD =================

exports.requestCard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Already has card?
    const existingCard = await Card.findOne({
      user: user._id,
    });

    if (existingCard) {
      return res.status(400).json({
        message: "You already have a virtual card.",
      });
    }

    const card = await Card.create({
      user: user._id,
      cardNumber: generateCardNumber(),
      cvv: generateCVV(),
      expiry: generateExpiry(),
    });

    res.status(201).json({
      message: "Virtual card created successfully.",
      card,
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Unable to create card.",
    });
  }
};

// ================= GET CARD =================

exports.getCard = async (req, res) => {
  try {
    const card = await Card.findOne({
      user: req.user.id,
    });

    if (!card) {
      return res.status(404).json({
        message: "No virtual card found.",
      });
    }

    res.json(card);

  } catch (err) {
    res.status(500).json({
      message: "Unable to load card.",
    });
  }
};