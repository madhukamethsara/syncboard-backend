const crypto = require("crypto");

const generateInvitationToken = () => {
  // Token that will be sent in the email
  const token = crypto.randomBytes(32).toString("hex");

  // Hashed version stored in MongoDB
  const tokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  return {
    token,
    tokenHash,
  };
};

module.exports = generateInvitationToken;