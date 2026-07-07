const router = require("express").Router();
const auth = require("../middleware/authMiddleware");

const {
  createAccount,
  getAccount
} = require("../controllers/accountController");

router.post("/create", auth, createAccount);
router.get("/", auth, getAccount);

module.exports = router;