const router = require("express").Router();

const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const {
  createAccount,
  getAccount,
  getProfile,
  updateProfile,
  updateProfilePhoto,
  upgradeAccountTier,
} = require("../controllers/accountController");

// Account
router.post("/create", auth, createAccount);
router.get("/", auth, getAccount);

// Profile
router.get("/profile", auth, getProfile);

router.put(
  "/profile",
  auth,
  updateProfile
);

// Profile Photo
router.put(
  "/profile/photo",
  auth,
  upload.single("photo"),
  updateProfilePhoto
);

// Account Tier
router.put(
  "/upgrade-tier",
  auth,
  upgradeAccountTier
);

module.exports = router;