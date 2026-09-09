const resend = require("../utils/mailer");

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const sendVerificationEmail = async (email, token) => {
  const baseUrl = process.env.BASE_URL || "http://localhost:5000";
  const verificationUrl = `${baseUrl}/api/auth/verify-email/${token}`;

  const fromAddress = process.env.EMAIL_FROM || "onboarding@resend.dev";

  console.log(`Sending verification email to ${email}`);
  console.log(`Verification URL: ${verificationUrl}`);
  console.log(`Using BASE_URL: ${baseUrl}`);

  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { data, error } = await resend.emails.send({
        from: `SyncBoard <${fromAddress}>`,
        to: email,
        subject: "Verify your SyncBoard email",
        text: `Verify your email by visiting: ${verificationUrl}`,
        html: `<p>Click <a href="${verificationUrl}">here</a> to verify your email.</p>`,
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log(`Verification email sent to ${email} (attempt ${attempt}), ID: ${data?.id}`);
      return;
    } catch (error) {
      lastError = error;
      console.error(
        `Email send attempt ${attempt}/${MAX_RETRIES} failed for ${email}:`,
        error.message
      );
      if (attempt < MAX_RETRIES) await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  throw new Error(
    `Failed to send verification email to ${email} after ${MAX_RETRIES} attempts: ${lastError.message}`
  );
};

module.exports = {
  sendVerificationEmail,
};
