const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Board",
      required: true,
    },

    column: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Column",
      required: true,
    },

    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    dueDate: {
      type: Date,
      default: null,
    },

    labels: {
      type: [String],
      default: [],
    },

    attachments: {
      type: [String],
      default: [],
    },

    position: {
      type: Number,
      required: true,
      default: 0,
    },

    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        text: {
          type: String,
          required: true,
          trim: true,
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.model(
    "Task",
    taskSchema
  );
