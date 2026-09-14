const crypto = require("crypto");

const generateInvitationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

module.exports = generateInvitationToken;
