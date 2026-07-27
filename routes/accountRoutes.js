const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const {
  createAccount,
  getAccount,
  getProfile,
  updateProfile,
} = require("../controllers/accountController");

router.post("/create", auth, createAccount);
router.get("/", auth, getAccount);

router.put(
    "/profile/photo",
    auth,
    upload.single("photo"),
    updateProfilePhoto
);

module.exports = router;