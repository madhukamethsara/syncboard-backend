const crypto = require("crypto");

const generateVerificationToken = () => {
  // Generate a secure random token
  const token = crypto.randomBytes(32).toString("hex");

  // Hash the token before storing it in MongoDB
  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  return {
    token,
    hashedToken,
  };
};

module.exports = generateVerificationToken;