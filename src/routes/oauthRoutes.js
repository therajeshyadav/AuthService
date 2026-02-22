const express = require("express");
const passport = require("../config/passport");

const router = express.Router();

/* ===== GOOGLE LOGIN ===== */

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const { token } = req.user;
    res.redirect(`${process.env.FRONTEND_URL}/auth-success?token=${token}`);
  }
);

/* ===== GITHUB LOGIN ===== */

router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

router.get(
  "/github/callback",
  passport.authenticate("github", { session: false }),
  (req, res) => {
    const { token } = req.user;
    res.redirect(`${process.env.FRONTEND_URL}/auth-success?token=${token}`);
  }
);

module.exports = router;
