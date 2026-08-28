const Column = require("../models/Column");
const Board = require("../models/Board");
const Task = require("../models/Task");

const {
  createColumnSchema,
  updateColumnSchema,
} = require("../validators/columnValidator");

function getBoardPermission(board, userId) {
  if (!board.team) {
    const isCreator =
      board.createdBy?.toString() === userId;

    return {
      canView: isCreator,
      canEdit: isCreator,
      canDelete: isCreator,
    };
  }

  const team = board.team;

  const isOwner =
    team.owner?.toString() === userId;

  const member = team.members?.find(
    (member) =>
      member.user?.toString() === userId
  );

  return {
    canView: Boolean(
      isOwner || member
    ),

    canEdit: Boolean(
      isOwner ||
        member?.role === "owner" ||
        member?.role === "admin" ||
        member?.role === "member"
    ),

    canDelete: Boolean(
      isOwner ||
        member?.role === "owner" ||
        member?.role === "admin"
    ),
  };
}

const createColumn = async (req, res) => {
  try {
    const result =
      createColumnSchema.safeParse(
        req.body
      );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors:
          result.error.flatten()
            .fieldErrors,
      });
    }

    const { name, boardId } =
      result.data;

    const userId =
      req.user._id.toString();

    const board =
      await Board.findById(
        boardId
      ).populate(
        "team",
        "owner members"
      );

    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    const permission =
      getBoardPermission(
        board,
        userId
      );

    if (!permission.canEdit) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have access to this board",
      });
    }

    const lastColumn =
      await Column.findOne({
        board: boardId,
      }).sort({
        position: -1,
      });

    const position = lastColumn
      ? lastColumn.position + 1
      : 0;

    const column =
      await Column.create({
        name,
        board: boardId,
        position,
      });

    return res.status(201).json({
      success: true,
      message:
        "Column created successfully",
      column,
    });
  } catch (error) {
    console.error(
      "CREATE COLUMN ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Internal server error",
    });
  }
};

const getBoardColumns = async (
  req,
  res
) => {
  try {
    const { boardId } = req.params;

    const userId =
      req.user._id.toString();

    const board =
      await Board.findById(
        boardId
      ).populate(
        "team",
        "owner members"
      );

    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    const permission =
      getBoardPermission(
        board,
        userId
      );

    if (!permission.canView) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have access to this board",
      });
    }

    const columns =
      await Column.find({
        board: boardId,
      }).sort({
        position: 1,
      });

    return res.status(200).json({
      success: true,
      columns,
    });
  } catch (error) {
    console.error(
      "GET BOARD COLUMNS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Internal server error",
    });
  }
};

const updateColumn = async (
  req,
  res
) => {
  try {
    const { columnId } =
      req.params;

    const userId =
      req.user._id.toString();

    const result =
      updateColumnSchema.safeParse(
        req.body
      );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors:
          result.error.flatten()
            .fieldErrors,
      });
    }

    const column =
      await Column.findById(
        columnId
      ).populate({
        path: "board",
        populate: {
          path: "team",
          select: "owner members",
        },
      });

    if (!column) {
      return res.status(404).json({
        success: false,
        message:
          "Column not found",
      });
    }

    if (!column.board) {
      return res.status(404).json({
        success: false,
        message:
          "Board not found",
      });
    }

    const permission =
      getBoardPermission(
        column.board,
        userId
      );

    if (!permission.canEdit) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to update this column",
      });
    }

    const updatedColumn =
      await Column.findByIdAndUpdate(
        columnId,
        result.data,
        {
          new: true,
          runValidators: true,
        }
      );

    return res.status(200).json({
      success: true,
      message:
        "Column updated successfully",
      column: updatedColumn,
    });
  } catch (error) {
    console.error(
      "UPDATE COLUMN ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Internal server error",
    });
  }
};

const deleteColumn = async (
  req,
  res
) => {
  try {
    const { columnId } =
      req.params;

    const userId =
      req.user._id.toString();

    const column =
      await Column.findById(
        columnId
      ).populate({
        path: "board",
        populate: {
          path: "team",
          select: "owner members",
        },
      });

    if (!column) {
      return res.status(404).json({
        success: false,
        message:
          "Column not found",
      });
    }

    if (!column.board) {
      return res.status(404).json({
        success: false,
        message:
          "Board not found",
      });
    }

    const permission =
      getBoardPermission(
        column.board,
        userId
      );

    if (!permission.canDelete) {
      return res.status(403).json({
        success: false,
        message:
          "You do not have permission to delete this column",
      });
    }

    const taskCount =
      await Task.countDocuments({
        column: columnId,
      });

    if (taskCount > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete a column that still contains tasks",
      });
    }

    await Column.findByIdAndDelete(
      columnId
    );

    return res.status(200).json({
      success: true,
      message:
        "Column deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE COLUMN ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Internal server error",
    });
  }
};

module.exports = {
  createColumn,
  getBoardColumns,
  updateColumn,
  deleteColumn,
};