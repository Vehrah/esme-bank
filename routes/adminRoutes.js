const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

const {
  getDashboard,
  getUsers,
  getTransactions,
   getAnalytics,
   freezeAccount,
  unfreezeAccount,
  getAuditLogs,
} = require("../controllers/adminController");

router.get("/dashboard", auth, getDashboard);
router.get("/users", auth, getUsers);
router.get("/transactions", auth, getTransactions);
router.get("/analytics", auth, getAnalytics);
router.patch("/freeze/:id", auth, freezeAccount);
router.patch("/unfreeze/:id", auth, unfreezeAccount);
router.get("/logs", auth, getAuditLogs);
module.exports = router;