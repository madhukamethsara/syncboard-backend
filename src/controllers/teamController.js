const Team = require("../models/Team");
const TeamInvitation = require("../models/TeamInvitation");
const Board = require("../models/Board");
const Column = require("../models/Column");
const Task = require("../models/Task");
const {
  createTeamSchema,
  updateTeamSchema,
  updateMemberRoleSchema,
  createInvitationSchema,
} = require("../validators/teamValidator");
const User = require("../models/User");
const Notification = require("../models/Notification");
const generateInvitationToken = require("../utils/invitationToken");
const transporter = require("../utils/mailer");

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
      joinCode: generateJoinCode(),
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
      (member) => member.user._id.toString() === userId.toString(),
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

    const boards = await Board.find({ team: teamId }).select("_id");
    const boardIds = boards.map((board) => board._id);
    await Promise.all([
      Task.deleteMany({ board: { $in: boardIds } }),
      Column.deleteMany({ board: { $in: boardIds } }),
      Board.deleteMany({ team: teamId }),
      TeamInvitation.deleteMany({ team: teamId }),
      Team.findByIdAndDelete(teamId),
    ]);

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
      "name email avatar",
    );

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    const isMember = team.members.some(
      (member) => member.user._id.toString() === userId.toString(),
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
      (member) => member.user.toString() === userId,
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

const inviteByEmail = async (req, res) => {
  try {
    const { teamId } = req.params;
    const loggedInUserId = req.user._id;

    const result = inviteByEmailSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { email } = result.data;

    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    const loggedInMember = team.members.find(
      (member) => member.user.toString() === loggedInUserId.toString(),
    );

    // Only owner/admin can invite
    if (!loggedInMember || !["owner", "admin"].includes(loggedInMember.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to invite members",
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const joinLink = `${frontendUrl}/join?code=${team.joinCode}`;

    await transporter.sendMail({
      from: `"SyncBoard" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `You're invited to join ${team.name} on SyncBoard`,
      text: `You've been invited to join ${team.name} on SyncBoard.

Your join code: ${team.joinCode}

Click here to join directly:
${joinLink}

Or log in and enter the code manually.`,
      html: `
        <h2>You're invited to join ${team.name}</h2>
        <p>You've been invited to join <strong>${team.name}</strong> on SyncBoard.</p>
        <p>Your join code: <strong>${team.joinCode}</strong></p>
        <p><a href="${joinLink}">Click here to join directly</a></p>
        <p>Or log in and enter the code manually.</p>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Invitation email sent successfully",
      email,
      role,
      invitedBy: loggedInUserId,
      tokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
  } catch (error) {
    console.error("Invite by email error:", error);

    // 7. Build invitation link
    const inviteUrl = `http://localhost:5000/api/invitations/${token}/accept`;

const getJoinCode = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user._id;

    const team = await Team.findById(teamId).select("joinCode owner");

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    if (team.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the team owner can view the join code",
      });
    }

    const invitedUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (
      invitedUser &&
      invitedUser._id.toString() !== loggedInUserId.toString()
    ) {
      await Notification.create({
        user: invitedUser._id,
        type: "team_invitation",
        title: "Team invitation",
        message: `You were invited to join "${team.name}" as ${role}`,
        relatedTeam: team._id,
      });
    }

    return res.status(201).json({
      success: true,
      joinCode: team.joinCode,
    });
  } catch (error) {
    console.error("Get join code error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const regenerateJoinCode = async (req, res) => {
  try {
    const { teamId } = req.params;
    const userId = req.user._id;

    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    // Check if logged-in user belongs to the team
    const currentMember = team.members.find(
      (member) => member.user.toString() === req.user._id.toString(),
    );

    if (!currentMember) {
      return res.status(403).json({
        success: false,
        message: "Only the team owner can regenerate the join code",
      });
    }

    // Only owner/admin can view invitations
    if (currentMember.role !== "owner" && currentMember.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Invalid join code",
      });
    }

    const alreadyMember = team.members.some(
      (member) => member.user.toString() === userId.toString()
    );

    if (alreadyMember) {
      return res.status(409).json({
        success: false,
        message: "You are already a member of this team",
      });
    }

    team.members.push({
      user: userId,
      role: "member",
    });

    await team.save();

    return res.status(200).json({
      success: true,
      message: "Successfully joined the team",
      team: {
        id: team._id,
        name: team.name,
      },
    });
  } catch (error) {
    console.error("Join team by code error:", error);

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
  getTeamInvitations,
};
