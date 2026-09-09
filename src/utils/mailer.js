const { Resend } = require("resend");

if (!process.env.RESEND_API_KEY) {
  console.warn(
    "Email is not configured: set RESEND_API_KEY in .env. Emails will fail to send."
  );
}

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = resend;
