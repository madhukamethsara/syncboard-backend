const Board = require("../models/Board");
const Team = require("../models/Team");

const {
  createBoardSchema,
  updateBoardSchema,
} = require("../validators/boardValidator");

const createBoard = async (req, res) => {
  try {
    const result = createBoardSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const { name, description, teamId } = result.data;

    if (teamId) {
      const team = await Team.findById(teamId);

      if (!team) {
        return res.status(404).json({
          success: false,
          message: "Team not found",
        });
      }

      const userId = req.user._id.toString();

      const isOwner = team.owner.toString() === userId;

      const isMember = team.members.some(
        (member) => member.user.toString() === userId,
      );

      if (!isOwner && !isMember) {
        return res.status(403).json({
          success: false,
          message: "You are not a member of this team",
        });
      }
    }

    const board = await Board.create({
      name,
      description: description || "",
      team: teamId || null,
      createdBy: req.user._id,
    });

    const populatedBoard = await Board.findById(board._id)
      .populate("team", "name members owner")
      .populate("createdBy", "name email avatar");

    return res.status(201).json({
      success: true,
      message: "Board created successfully",
      board: populatedBoard,
    });
  } catch (error) {
    console.error("CREATE BOARD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while creating board",
    });
  }
};

const getMyBoards = async (req, res) => {
  try {
    const userId = req.user._id;

    console.log("LOGGED USER:", userId);

    const teams = await Team.find({
      $or: [{ owner: userId }, { "members.user": userId }],
    }).select("_id");

    const teamIds = teams.map((team) => team._id);

    console.log("USER TEAMS:", teamIds);

    const boards = await Board.find({
      $or: [
        {
          team: {
            $in: teamIds,
          },
        },
        {
          team: null,
          createdBy: userId,
        },
      ],
    })
      .populate("team", "name members owner")
      .populate("createdBy", "name email avatar")
      .sort({ createdAt: -1 });

    console.log("BOARDS FOUND:", boards);

    return res.status(200).json({
      success: true,
      boards,
    });
  } catch (error) {
    console.error("GET BOARDS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const getBoardById = async (req, res) => {
  try {
    const { boardId } = req.params;

    const userId = req.user._id.toString();

    const board = await Board.findById(boardId)
      .populate("team", "name members owner")
      .populate("createdBy", "name email avatar");

    if (!board) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    if (!board.team) {
      const isCreator = board.createdBy._id.toString() === userId;

      if (!isCreator) {
        return res.status(403).json({
          success: false,
          message: "You do not have access to this board",
        });
      }

      return res.status(200).json({
        success: true,
        board,
      });
    }

    const team = board.team;

    const isOwner = team.owner && team.owner.toString() === userId;

    const isMember =
      Array.isArray(team.members) &&
      team.members.some((member) => member.user.toString() === userId);

    if (!isOwner && !isMember) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this board",
      });
    }

    return res.status(200).json({
      success: true,
      board,
    });
  } catch (error) {
    console.error("GET BOARD BY ID ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const updateBoard = async (req, res) => {
  try {
    const { boardId } = req.params;

    const userId = req.user._id.toString();

    const result = updateBoardSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

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

    if (!board.team) {
      const isCreator = board.createdBy.toString() === userId;

      if (!isCreator) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to update this board",
        });
      }
    } else {
      const team = board.team;

      const isOwner = team.owner && team.owner.toString() === userId;

      const member = team.members.find(
        (member) => member.user.toString() === userId,
      );

      const canEdit =
        isOwner || member?.role === "owner" || member?.role === "admin";

      if (!canEdit) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to update this board",
        });
      }
    }

    const updatedBoard = await Board.findByIdAndUpdate(boardId, result.data, {
      new: true,
      runValidators: true,
    })
      .populate("team", "name members owner")
      .populate("createdBy", "name email avatar");

    return res.status(200).json({
      success: true,
      message: "Board updated successfully",
      board: updatedBoard,
    });
  } catch (error) {
    console.error("UPDATE BOARD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const deleteBoard = async (req, res) => {
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

    if (!board.team) {
      const isCreator = board.createdBy.toString() === userId;

      if (!isCreator) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to delete this board",
        });
      }
    } else {
      const team = board.team;

      const isOwner = team.owner && team.owner.toString() === userId;

      const member = team.members.find(
        (member) => member.user.toString() === userId,
      );

      const canDelete =
        isOwner || member?.role === "owner" || member?.role === "admin";

      if (!canDelete) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to delete this board",
        });
      }
    }

    await Board.findByIdAndDelete(boardId);

    return res.status(200).json({
      success: true,
      message: "Board deleted successfully",
    });
  } catch (error) {
    console.error("DELETE BOARD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = {
  createBoard,
  getMyBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
};
