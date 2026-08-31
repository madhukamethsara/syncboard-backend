const argon2 = require("argon2");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { registerSchema , loginSchema } = require("../validators/authValidator");
const generateVerificationToken = require("../utils/verificationToken")
const { sendVerificationEmail } = require("../services/emailservice");


//register
const register = async (req, res) => {
  try {
    // Validate incoming data
    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { name, email, password } = result.data;

    // Check whether user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Hash password
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
    });

    const verificationRequired = process.env.EMAIL_VERIFICATION_REQUIRED === "true";
    const { token, hashedToken } = verificationRequired
      ? generateVerificationToken()
      : { token: null, hashedToken: null };

    // Save user
    const user = await User.create({
      name,
      email,
      passwordHash,
      isEmailVerified: !verificationRequired,
      ...(verificationRequired && {
        emailVerificationToken: hashedToken,
        emailVerificationExpires: new Date(Date.now() + 60 * 60 * 1000),
      }),
    });

    if (verificationRequired) await sendVerificationEmail(user.email, token);

    return res.status(201).json({
      success: true,
      message: verificationRequired
        ? "User registered successfully. Please check your email to verify your account."
        : "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


//verification mail
const verifyEmail = async (req, res) => {
  try {
    // Get raw token from URL
    const { token } = req.params;

    // Hash the raw token
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with matching token that has not expired
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Verification link is invalid or has expired",
      });
    }

    // Mark email as verified
    user.isEmailVerified = true;

    // Remove verification token
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Email verification error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


//login function
const login = async (req, res) => {
  try {
    //Validate request data
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { email, password } = result.data;

    //Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    //Verify password
    const passwordMatches = await argon2.verify(
      user.passwordHash,
      password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isEmailVerified) {
      const { token: verificationToken, hashedToken } =
        generateVerificationToken();

      user.emailVerificationToken = hashedToken;
      user.emailVerificationExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();
      await sendVerificationEmail(user.email, verificationToken);

      return res.status(403).json({
        success: false,
        message: "Please verify your email. A new verification email was sent.",
      });
    }

    //Create JWT
    const token = jwt.sign(
      {
        userId: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
      }
    );

    //Store JWT in HttpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    //Return safe user data
    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


//get me function
const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};


//logout function
const logout = async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return res.status(200).json({
    success: true,
    message: "Logout successful",
  });
};


module.exports = {
  register,
  login,
  getMe,
  logout,
  verifyEmail,
};
