const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      required: true,
      enum: [
        "team_invitation",
        "board_shared",
        "task_assigned",
        "task_comment",
        "task_mention",
      ],
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    relatedTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },

    relatedBoard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
    },

    relatedTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
    },

    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ user: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
