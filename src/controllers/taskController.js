const Task = require("../models/Task");
const Board = require("../models/Board");
const Column = require("../models/Column");

const {
  createTaskSchema,
  updateTaskSchema,
} = require("../validators/taskValidator");

function getBoardPermission(board, userId) {
  if (!board.team) {
    const isCreator = board.createdBy?.toString() === userId;

    return {
      canView: isCreator,
      canEdit: isCreator,
      canDelete: isCreator,
    };
  }

  const team = board.team;

  const isOwner = team.owner?.toString() === userId;

  const member = team.members?.find(
    (member) => member.user?.toString() === userId,
  );

  return {
    canView: Boolean(isOwner || member),

    canEdit: Boolean(
      isOwner ||
      member?.role === "owner" ||
      member?.role === "admin" ||
      member?.role === "member",
    ),

    canDelete: Boolean(
      isOwner ||
      member?.role === "owner" ||
      member?.role === "admin" ||
      member?.role === "member",
    ),
  };
}

const createTask = async (req, res) => {
  try {
    const result = createTaskSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const {
      title,
      description,
      boardId,
      columnId,
      assignedTo,
      priority,
      dueDate,
    } = result.data;

    const userId = req.user._id.toString();

    const board = await Board.findById(boardId).populate(
      "team",
      "owner members",
    );

    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    const permission = getBoardPermission(board, userId);

    if (!permission.canEdit) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this board",
      });
    }

    const column = await Column.findOne({
      _id: columnId,
      board: boardId,
    });

    if (!column) {
      return res.status(400).json({
        success: false,
        message: "Column does not belong to this board",
      });
    }

    const lastTask = await Task.findOne({
      column: columnId,
    }).sort({
      position: -1,
    });

    const position = lastTask ? lastTask.position + 1 : 0;

    const task = await Task.create({
      title,
      description,
      board: boardId,
      column: columnId,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      priority,
      dueDate: dueDate || null,
      position,
    });

    const populatedTask = await Task.findById(task._id)
      .populate("assignedTo", "name email avatar")
      .populate("createdBy", "name email avatar")
      .populate("column", "name position");

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      task: populatedTask,
    });
  } catch (error) {
    console.error("CREATE TASK ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getBoardTasks = async (req, res) => {
  try {
    const { boardId } = req.params;

    const userId = req.user._id.toString();

    const board = await Board.findById(boardId).populate(
      "team",
      "owner members",
    );

    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    const permission = getBoardPermission(board, userId);

    if (!permission.canView) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this board",
      });
    }

    const tasks = await Task.find({
      board: boardId,
    })
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .populate("column", "name position")
      .populate("comments.user", "name email")
      .sort({
        position: 1,
      });

    return res.status(200).json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error("GET BOARD TASKS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const userId = req.user._id.toString();

    const result = updateTaskSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const task = await Task.findById(taskId).populate({
      path: "board",
      populate: {
        path: "team",
        select: "owner members",
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (!task.board) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    const permission = getBoardPermission(task.board, userId);

    if (!permission.canEdit) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this task",
      });
    }

    const updateData = {
      ...result.data,
    };

    if (updateData.columnId) {
      const newColumn = await Column.findOne({
        _id: updateData.columnId,
        board: task.board._id,
      });

      if (!newColumn) {
        return res.status(400).json({
          success: false,
          message: "Column does not belong to this board",
        });
      }

      updateData.column = updateData.columnId;

      delete updateData.columnId;

      const lastTask = await Task.findOne({
        column: newColumn._id,
        _id: {
          $ne: taskId,
        },
      }).sort({
        position: -1,
      });

      updateData.position = lastTask ? lastTask.position + 1 : 0;
    }

    const updatedTask = await Task.findByIdAndUpdate(taskId, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("assignedTo", "name email avatar")
      .populate("createdBy", "name email avatar")
      .populate("column", "name position");

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error("UPDATE TASK ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const userId = req.user._id.toString();

    const task = await Task.findById(taskId).populate({
      path: "board",
      populate: {
        path: "team",
        select: "owner members",
      },
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    if (!task.board) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    const permission = getBoardPermission(task.board, userId);

    if (!permission.canDelete) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this task",
      });
    }

    await Task.findByIdAndDelete(taskId);

    return res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("DELETE TASK ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const addTaskComment = async (req, res) => {
  try {
    const { taskId } = req.params;

    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        message: "Comment text is required",
      });
    }

    const task = await Task.findById(taskId).populate({
      path: "board",
      populate: {
        path: "team",
        select: "owner members",
      },
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    if (!task.board) {
      return res.status(404).json({
        message: "Board not found",
      });
    }

    const userId = req.user._id?.toString() || req.user.id?.toString();

    const permission = getBoardPermission(task.board, userId);

    if (!permission.canView) {
      return res.status(403).json({
        message: "You do not have permission to comment on this task",
      });
    }

    task.comments.push({
      user: userId,
      text: text.trim(),
    });

    await task.save();

    await task.populate({
      path: "comments.user",
      select: "name email",
    });

    const newComment = task.comments[task.comments.length - 1];

    return res.status(201).json({
      message: "Comment added",
      comment: newComment,
    });
  } catch (error) {
    console.error("ADD TASK COMMENT ERROR:", error);

    return res.status(500).json({
      message: "Failed to add comment",
    });
  }
};

module.exports = {
  createTask,
  getBoardTasks,
  updateTask,
  deleteTask,
  addTaskComment,
};
