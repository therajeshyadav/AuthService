const jwt = require("jsonwebtoken");

module.exports = (userId, username) => {
  return jwt.sign(
    { id: userId, username: username },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};
