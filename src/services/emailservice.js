const transporter = require("../utils/mailer");

const sendVerificationEmail = async (email, token) => {
  const baseUrl = process.env.BASE_URL || "http://localhost:5000";
  const verificationUrl =
    `${baseUrl}/api/auth/verify-email/${token}`;

  await transporter.sendMail({
    from: `"SyncBoard" <${process.env.EMAIL_USER || "no-reply@syncboard.local"}>`,
    to: email,
    subject: "Verify your SyncBoard email",
    text: `Verify your email by visiting: ${verificationUrl}`,
  });
};

module.exports = {
  sendVerificationEmail,
};
