const mongoose = require("mongoose");

const teamInvitationSchema = new mongoose.Schema(
  {
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      required: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member",
    },

    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    token: {
      type: String,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

teamInvitationSchema.index({ team: 1, email: 1 });
teamInvitationSchema.index({ token: 1 });
teamInvitationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const TeamInvitation = mongoose.model("TeamInvitation", teamInvitationSchema);

module.exports = TeamInvitation;
