const User = require("../models/User");
const argon2 = require("argon2");
const { updateProfileSchema , changePasswordSchema } = require("../validators/userValidator");

const getMyProfile = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const updateMyProfile = async (req, res) => {

  try {
    console.log("PROFILE UPDATE CALLED");
    console.log("BODY:", req.body);

    const result = updateProfileSchema.safeParse(req.body);

    console.log("VALIDATION:", result);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { name, avatar } = result.data;

    if (name === undefined && avatar === undefined) {
      return res.status(400).json({
        success: false,
        message: "No profile fields provided",
      });
    }

    const updateData = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (avatar !== undefined) {
      updateData.avatar = avatar;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const result = changePasswordSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const {
      currentPassword,
      newPassword,
    } = result.data;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const passwordMatches = await argon2.verify(
      user.passwordHash,
      currentPassword
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const newPasswordHash = await argon2.hash(newPassword, {
      type: argon2.argon2id,
    });

    user.passwordHash = newPasswordHash;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  changePassword,
};