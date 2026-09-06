const express = require("express");
const { createBoard, getMyBoards, getBoardById, updateBoard, deleteBoard } = require("../controllers/boardController");
const { createTask } = require("../controllers/taskController");
const authenticate = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authenticate, createBoard);
router.get("/", authenticate, getMyBoards);
router.get("/:boardId", authenticate, getBoardById);
router.patch("/:boardId", authenticate, updateBoard);
router.delete("/:boardId", authenticate, deleteBoard);
router.post("/:boardId/tasks", authenticate, createTask);

module.exports = router;