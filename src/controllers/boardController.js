const Board = require("../models/Board");
const Team = require("../models/Team");
const Column = require("../models/Column");
const Task = require("../models/Task");
const { createBoardSchema, updateBoardSchema } = require("../validators/boardValidator");
const { getBoardPermission, isValidId } = require("../utils/boardAccess");

const populateBoard = (query) => query
  .populate({ path: "team", select: "name members owner", populate: [
    { path: "owner", select: "name email avatar" },
    { path: "members.user", select: "name email avatar" },
  ] })
  .populate("createdBy", "name email avatar");

function validationError(res, result) {
  return res.status(400).json({ success: false, message: "Validation failed", errors: result.error.flatten().fieldErrors });
}

async function findAccessibleBoard(boardId, userId) {
  if (!isValidId(boardId)) return null;
  const board = await populateBoard(Board.findById(boardId));
  if (!board || !getBoardPermission(board, userId).canView) return null;
  return board;
}

const createBoard = async (req, res) => {
  try {
    const result = createBoardSchema.safeParse(req.body);
    if (!result.success) return validationError(res, result);
    const { name, description, teamId } = result.data;

    if (teamId) {
      const team = await Team.findById(teamId);
      if (!team) return res.status(404).json({ success: false, message: "Team not found" });
      const permission = getBoardPermission({ team, createdBy: req.user._id }, req.user._id);
      if (!permission.canView) return res.status(403).json({ success: false, message: "You are not a member of this team" });
    }

    const board = await Board.create({ name, description, team: teamId || null, createdBy: req.user._id });
    await Column.insertMany([
      { name: "To Do", board: board._id, position: 0 },
      { name: "In Progress", board: board._id, position: 1 },
      { name: "Done", board: board._id, position: 2 },
    ]);
    const populatedBoard = await populateBoard(Board.findById(board._id));
    return res.status(201).json({ success: true, message: "Board created successfully", board: populatedBoard });
  } catch (error) {
    console.error("CREATE BOARD ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to create board" });
  }
};

const getMyBoards = async (req, res) => {
  try {
    const userId = req.user._id;
    const teams = await Team.find({ $or: [{ owner: userId }, { "members.user": userId }] }).select("_id");
    const boards = await populateBoard(Board.find({
      $or: [{ team: { $in: teams.map((team) => team._id) } }, { team: null, createdBy: userId }],
    }).sort({ createdAt: -1 }));
    return res.json({ success: true, boards });
  } catch (error) {
    console.error("GET BOARDS ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to load boards" });
  }
};

const getBoardById = async (req, res) => {
  try {
    if (!isValidId(req.params.boardId)) return res.status(400).json({ success: false, message: "Invalid board ID" });
    const board = await populateBoard(Board.findById(req.params.boardId));
    if (!board) return res.status(404).json({ success: false, message: "Board not found" });
    if (!getBoardPermission(board, req.user._id).canView) return res.status(403).json({ success: false, message: "You do not have access to this board" });
    return res.json({ success: true, board });
  } catch (error) {
    console.error("GET BOARD ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to load board" });
  }
};

const updateBoard = async (req, res) => {
  try {
    const result = updateBoardSchema.safeParse(req.body);
    if (!result.success) return validationError(res, result);
    const board = await findAccessibleBoard(req.params.boardId, req.user._id);
    if (!board) return res.status(404).json({ success: false, message: "Board not found or unavailable" });
    if (!getBoardPermission(board, req.user._id).canDelete) return res.status(403).json({ success: false, message: "Only a board owner or team admin can edit this board" });
    Object.assign(board, result.data);
    await board.save();
    const populatedBoard = await populateBoard(Board.findById(board._id));
    return res.json({ success: true, message: "Board updated successfully", board: populatedBoard });
  } catch (error) {
    console.error("UPDATE BOARD ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to update board" });
  }
};

const deleteBoard = async (req, res) => {
  try {
    const board = await findAccessibleBoard(req.params.boardId, req.user._id);
    if (!board) return res.status(404).json({ success: false, message: "Board not found or unavailable" });
    if (!getBoardPermission(board, req.user._id).canDelete) return res.status(403).json({ success: false, message: "Only a board owner or team admin can delete this board" });
    await Promise.all([Task.deleteMany({ board: board._id }), Column.deleteMany({ board: board._id }), Board.deleteOne({ _id: board._id })]);
    return res.json({ success: true, message: "Board deleted successfully" });
  } catch (error) {
    console.error("DELETE BOARD ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to delete board" });
  }
};

module.exports = { createBoard, getMyBoards, getBoardById, updateBoard, deleteBoard };
