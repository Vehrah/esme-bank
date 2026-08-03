const express = require("express");

const router = express.Router();

const {
  requestCard,
  getCard,
} = require("../controllers/cardController");

const authMiddleware = require("../middleware/authMiddleware");

// Request Virtual Card
router.post(
  "/request",
  authMiddleware,
  requestCard
);

// Get User Card
router.get(
  "/",
  authMiddleware,
  getCard
);

module.exports = router;