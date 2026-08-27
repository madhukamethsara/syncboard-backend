const Team = require("../models/Team");
const TeamInvitation = require("../models/TeamInvitation");
const generateInvitationToken = require("../utils/invitationToken");
const transporter = require("../utils/mailer");
const { createTeamSchema ,updateTeamSchema ,updateMemberRoleSchema,createInvitationSchema} = require("../validators/teamValidator");


const createTeam = async (req, res) => {
  try {
    // Validate request body
    const result = createTeamSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { name } = result.data;

    // Logged-in user becomes the owner
    const ownerId = req.user._id;

    const team = await Team.create({
      name,
      owner: ownerId,

      members: [
        {
          user: ownerId,
          role: "owner",
        },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Team created successfully",
      team,
    });
  } catch (error) {
    console.error("Create team error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getMyTeams = async (req, res) => {
  try {
    const userId = req.user._id;

    const teams = await Team.find({
      "members.user": userId,
    })
      .populate("owner", "name email avatar")
      .populate("members.user", "name email avatar");

    return res.status(200).json({
      success: true,
      teams,
    });
  } catch (error) {
    console.error("Get teams error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getTeamById = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user._id;

    const team = await Team.findById(teamId)
      .populate("owner", "name email avatar")
      .populate("members.user", "name email avatar");

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Check whether logged-in user belongs to this team
    const isMember = team.members.some(
      (member) => member.user._id.toString() === userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this team",
      });
    }

    return res.status(200).json({
      success: true,
      team,
    });
  } catch (error) {
    console.error("Get team error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const updateTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user._id;

    const result = updateTeamSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    if (team.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the team owner can update this team",
      });
    }

    team.name = result.data.name;

    await team.save();

    return res.status(200).json({
      success: true,
      message: "Team updated successfully",
      team,
    });
  } catch (error) {
    console.error("Update team error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const deleteTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user._id;

    // Find team
    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Only the owner can delete the team
    if (team.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the team owner can delete this team",
      });
    }

    // Delete team
    await Team.findByIdAndDelete(teamId);

    return res.status(200).json({
      success: true,
      message: "Team deleted successfully",
    });
  } catch (error) {
    console.error("Delete team error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getTeamMembers = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user._id;

    const team = await Team.findById(teamId).populate(
      "members.user",
      "name email avatar"
    );

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    const isMember = team.members.some(
      (member) => member.user._id.toString() === userId.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this team",
      });
    }

    return res.status(200).json({
      success: true,
      members: team.members,
    });
  } catch (error) {
    console.error("Get team members error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const updateMemberRole = async (req, res) => {
  try {
    const { teamId, userId } = req.params;
    const loggedInUserId = req.user._id;

    const result = updateMemberRoleSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { role } = result.data;

    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Only owner can change member roles
    if (team.owner.toString() !== loggedInUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the team owner can change member roles",
      });
    }

    const member = team.members.find(
      (member) => member.user.toString() === userId
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    // Owner role cannot be changed here
    if (member.role === "owner") {
      return res.status(400).json({
        success: false,
        message: "Owner role cannot be changed",
      });
    }

    member.role = role;

    await team.save();

    return res.status(200).json({
      success: true,
      message: "Member role updated successfully",
      member,
    });
  } catch (error) {
    console.error("Update member role error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const createTeamInvitation = async (req, res) => {
  try {
    const { teamId } = req.params;
    const loggedInUserId = req.user._id;

    // 1. Validate email + role
    const result = createInvitationSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { email, role } = result.data;

    // 2. Find the team
    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // 3. Find logged-in user's membership
    const loggedInMember = team.members.find(
      (member) =>
        member.user.toString() === loggedInUserId.toString()
    );

    // Only owner/admin can invite
    if (
      !loggedInMember ||
      !["owner", "admin"].includes(loggedInMember.role)
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to invite members",
      });
    }

    // Admin cannot invite another admin
    if (loggedInMember.role === "admin" && role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Only the team owner can invite admins",
      });
    }

    // 4. Check for an existing pending invitation
    const existingInvitation = await TeamInvitation.findOne({
      team: teamId,
      email,
      status: "pending",
      expiresAt: { $gt: new Date() },
    });

    if (existingInvitation) {
      return res.status(409).json({
        success: false,
        message: "A pending invitation already exists for this email",
      });
    }

    // 5. Generate secure invitation token
    const { token, tokenHash } = generateInvitationToken();

    // 6. Save invitation
    const invitation = await TeamInvitation.create({
      team: teamId,
      email,
      role,
      invitedBy: loggedInUserId,
      tokenHash,
      expiresAt: new Date(
        Date.now() + 24 * 60 * 60 * 1000
      ),
    });

    // 7. Build invitation link
    const inviteUrl =
      `http://localhost:5000/api/invitations/${token}/accept`;

    // 8. Send email
    await transporter.sendMail({
      from: '"SyncBoard" <no-reply@syncboard.com>',
      to: email,
      subject: `Invitation to join ${team.name}`,
      text: `You have been invited to join ${team.name} on SyncBoard.

Accept your invitation here:

${inviteUrl}

This invitation expires in 24 hours.`,
    });

    return res.status(201).json({
      success: true,
      message: "Team invitation sent successfully",
      invitation: {
        id: invitation._id,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error("Create team invitation error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  createTeam,
  getMyTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  getTeamMembers,
  updateMemberRole,
  createTeamInvitation,
};