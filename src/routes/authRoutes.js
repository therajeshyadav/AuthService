const express = require("express");
const router = express.Router();

const { signup, verifyOTP, login, forgotPassword, resetPassword, getme, getUsersByIds, getUserByUsername } = require("../controllers/authController");
const authMiddleware = require("../middelware/authMiddleware");

router.post("/signup", signup);
router.post("/verify-otp", verifyOTP);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", authMiddleware, getme);
router.post("/users/batch", getUsersByIds);
router.get("/users/username/:username", getUserByUsername);

module.exports = router;
