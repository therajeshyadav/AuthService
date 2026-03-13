const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const cors = require("cors");
const passport = require("./config/passport");
const oauthRoutes = require("./routes/oauthRoutes");



const app = express();

const corsOptions = {
  origin: [
<<<<<<< Updated upstream
    process.env.FRONTEND_URL || "http://localhost:8080",
    "https://nexus-chat-topaz.vercel.app",
    "https://nexuschat.duckdns.org"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));


app.use(express.json());
app.use(passport.initialize());

app.use("/api/auth", oauthRoutes);

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);

app.get("/", (req, res) => {
  res.send("Auth Service is running");
});

const PORT = 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Auth service running on port ${PORT} (accessible externally)`);
});
