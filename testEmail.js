require("dotenv").config();

const transporter = require("./src/utils/mailer");

const sendTestEmail = async () => {
  try {
    const info = await transporter.sendMail({
      from: `"SyncBoard" <${process.env.EMAIL_USER}>`,
      to: "methsaramadhuka@gmail.com",
      subject: "SyncBoard Gmail Test",
      text: "Nodemailer with Gmail is working.",
    });

    console.log("Email sent:", info.messageId);
  } catch (error) {
    console.error("Email error:", error);
  }
};

sendTestEmail();