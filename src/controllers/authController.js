const prisma = require("../config/prisma");
const bcrypt = require("bcrypt");
const generateOTP = require("../utils/generateOTP");
const sendOTPEmail = require("../utils/sendEmail");
const sendResetEmail = require("../utils/sendResetEmail");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");


exports.signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Username, Email and password required",
      });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    // 🔥 If user already exists
    if (existingUser) {
      // If verified → error
      if (existingUser.isVerified) {
        return res.status(400).json({
          message: "Email already registered. Please login.",
        });
      }

      // If NOT verified → resend OTP
      const otp = generateOTP();

      await prisma.otp.deleteMany({
        where: { email },
      });

      await prisma.otp.create({
        data: {
          email,
          code: otp,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        },
      });

      await sendOTPEmail(email, otp);

      return res.status(200).json({
        message: "Account exists but not verified. OTP resent.",
      });
    }

    // ✅ New user
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        isVerified: false,
      },
    });

    const otp = generateOTP();

    await prisma.otp.create({
      data: {
        email,
        code: otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    await sendOTPEmail(email, otp);

    res.status(201).json({
      message: "Signup successful. Please verify OTP sent to email.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP required" });
    }

    const record = await prisma.otp.findFirst({
      where: { email, code: otp },
    });

    if (!record) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (record.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    await prisma.user.update({
      where: { email },
      data: { isVerified: true },
    });

    await prisma.otp.deleteMany({
      where: { email },
    });

    return res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "User Not Found",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email first",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid Password",
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(200).json({
        message: "If that email exists, a reset link has been sent.",
      });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash token before saving
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    await prisma.user.update({
      where: { email },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:8080"}/reset-password?token=${resetToken}`;

    await sendResetEmail(email, resetLink);

    res.status(200).json({
      message: "If that email exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired token",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpiresAt: null,
      },
    });

    res.status(200).json({
      message: "Password reset successful",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getme = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      username: true,
      email: true,
      isVerified: true,
      provider: true,
      avatar: true,
      banner: true,
      bio: true,
      status: true,
      createdAt: true,
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json(user);
}




exports.getUsersByIds = async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ message: "userIds array is required" });
    }

    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds.map(id => parseInt(id)) },
      },
      select: {
        id: true,
        username: true,
      },
    });

    res.json(users);
  } catch (error) {
    console.error("Get users by IDs error:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

exports.getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get user by username error:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
};
