const express = require("express");
const rateLimit = require("express-rate-limit");
const { register, login, getMe, logout, verifyEmail, resendVerification } = require("../controllers/authController");
const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

const verificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many verification attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

router.get("/me", authenticate, getMe);
router.get("/verify-email/:token", verificationLimiter, verifyEmail);
router.post("/resend-verification", verificationLimiter, resendVerification);

module.exports = router;