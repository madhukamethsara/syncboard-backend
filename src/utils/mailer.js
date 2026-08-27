const nodemailer = require("nodemailer");

if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
  console.warn(
    "Email is not configured: set EMAIL_USER and EMAIL_APP_PASSWORD in .env"
  );
}

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

module.exports = transporter;