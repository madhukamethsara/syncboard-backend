const crypto = require("crypto");

const Team = require("../models/Team");
const TeamInvitation = require("../models/TeamInvitation");

const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;

    // Logged-in user
    const currentUser = req.user;

    // Hash the raw token from the URL
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find valid pending invitation
    const invitation = await TeamInvitation.findOne({
      tokenHash,
      status: "pending",
      expiresAt: { $gt: new Date() },
    });

    if (!invitation) {
      return res.status(400).json({
        success: false,
        message: "Invitation is invalid or has expired",
      });
    }

    // Make sure invitation belongs to logged-in user's email
    if (
      invitation.email.toLowerCase() !==
      currentUser.email.toLowerCase()
    ) {
      return res.status(403).json({
        success: false,
        message: "This invitation belongs to another email address",
      });
    }

    // Find team
    const team = await Team.findById(invitation.team);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team no longer exists",
      });
    }

    // Check if user is already a member
    const alreadyMember = team.members.some(
      (member) =>
        member.user.toString() === currentUser._id.toString()
    );

    if (alreadyMember) {
      invitation.status = "accepted";
      await invitation.save();

      return res.status(409).json({
        success: false,
        message: "You are already a member of this team",
      });
    }

    // Add user to team
    team.members.push({
      user: currentUser._id,
      role: invitation.role,
    });

    await team.save();

    // Mark invitation as accepted
    invitation.status = "accepted";
    await invitation.save();

    return res.status(200).json({
      success: true,
      message: "Team invitation accepted successfully",
      team: {
        id: team._id,
        name: team.name,
        role: invitation.role,
      },
    });
  } catch (error) {
    console.error("Accept invitation error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  acceptInvitation,
};