const express = require("express");
const { register, login, getMe, logout, verifyEmail } = require("../controllers/authController");
const authenticate = require("../middleware/authmiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

router.get("/me", authenticate, getMe);
router.get("/verify-email/:token", verifyEmail);

module.exports = router;