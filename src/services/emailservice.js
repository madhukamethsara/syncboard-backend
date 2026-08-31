const transporter = require("../utils/mailer");

const sendVerificationEmail = async (email, token) => {
  const verificationUrl =
    `http://localhost:5000/api/auth/verify-email/${token}`;

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
