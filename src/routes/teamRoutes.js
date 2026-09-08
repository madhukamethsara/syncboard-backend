const express = require("express");

const {
  createTeam,
  getMyTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  getTeamMembers,
  updateMemberRole,
  inviteByEmail,
  getTeamInvitations,
  getJoinCode,
  regenerateJoinCode,
  joinTeamByCode,
} = require("../controllers/teamController");

const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

// Create a new team
router.post("/", authenticate, createTeam);
router.get("/", authenticate, getMyTeams);
router.post("/join", authenticate, joinTeamByCode);
router.get("/:teamId", authenticate, getTeamById);
router.patch("/:teamId", authenticate, updateTeam);
router.delete("/:teamId", authenticate, deleteTeam);
router.get("/:teamId/members", authenticate, getTeamMembers);
router.patch("/:teamId/members/:userId/role",authenticate,updateMemberRole);
router.post("/:teamId/invite",authenticate,inviteByEmail);
router.get("/:teamId/invitations", authenticate, getTeamInvitations);
router.get("/:teamId/join-code", authenticate, getJoinCode);
router.post("/:teamId/join-code/regenerate", authenticate, regenerateJoinCode);

module.exports = router;