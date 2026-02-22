const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profileController");
const authMiddleware = require("../middelware/authMiddleware");
const upload = require("../middleware/upload");

// Update profile with images
router.put(
  "/update",
  authMiddleware,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  profileController.updateProfile
);

// Get own profile
router.get("/me", authMiddleware, profileController.getProfile);

// Get user profile by ID
router.get("/:userId", authMiddleware, profileController.getProfile);

module.exports = router;
