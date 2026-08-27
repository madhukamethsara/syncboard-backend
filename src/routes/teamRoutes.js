const express = require("express");

const {
  createTeam,
  getMyTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  getTeamMembers,
  updateMemberRole,
  createTeamInvitation,
} = require("../controllers/teamController");

const authenticate = require("../middleware/authmiddleware");

const router = express.Router();

// Create a new team
router.post("/", authenticate, createTeam);
router.get("/", authenticate, getMyTeams);
router.get("/:teamId", authenticate, getTeamById);
router.patch("/:teamId", authenticate, updateTeam);
router.delete("/:teamId", authenticate, deleteTeam);
router.get("/:teamId/members", authenticate, getTeamMembers);
router.patch("/:teamId/members/:userId/role",authenticate,updateMemberRole);
router.post("/:teamId/invitations",authenticate,createTeamInvitation);

module.exports = router;