const express = require("express");

const {
  acceptInvitation,
} = require("../controllers/invitationController");

const authenticate = require("../middleware/authmiddleware");

const router = express.Router();

router.post(
  "/:token/accept",
  authenticate,
  acceptInvitation
);

module.exports = router;