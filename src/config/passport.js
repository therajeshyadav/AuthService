const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GithubStrategy = require("passport-github2").Strategy;
const { PrismaClient } = require("@prisma/client");
const generateToken = require("../utils/generateToken");


const prisma = new PrismaClient();

/* ================= GOOGLE STRATEGY ================= */

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;

        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          // Generate username from displayName (remove spaces, lowercase)
          const usernameFromName = profile.displayName
            .toLowerCase()
            .replace(/\s+/g, '')
            .substring(0, 20); // Limit to 20 chars
          
          user = await prisma.user.create({
            data: {
              email,
              username: usernameFromName,
              provider: "google",
              providerId: profile.id,
              isVerified: true,
            },
          });
        }

        const token = generateToken(user.id, user.username);

        return done(null, { user, token });

      } catch (error) {
        return done(error, null);
      }
    }
  )
);

/* ================= GITHUB STRATEGY ================= */

passport.use(
  new GithubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "http://localhost:5000/api/auth/github/callback",
      scope: ["user:email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email =
          profile.emails && profile.emails[0]
            ? profile.emails[0].value
            : `${profile.username}@github.com`;

        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              username: profile.username,
              provider: "github",
              providerId: profile.id,
              isVerified: true,
            },
          });
        }

        const token = generateToken(user.id, user.username);

        return done(null, { user, token });

      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;
