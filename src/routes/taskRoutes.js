const express = require("express");

const {
  createTask,
  getBoardTasks,
  updateTask,
  deleteTask,
  addTaskComment,
} = require("../controllers/taskController");

const authenticate = require("../middleware/authmiddleware");

const router = express.Router();

router.post("/", authenticate, createTask);
router.get("/board/:boardId", authenticate, getBoardTasks);
router.patch("/:taskId", authenticate, updateTask);
router.delete("/:taskId", authenticate, deleteTask);
router.post("/:taskId/comments",authenticate,addTaskComment);

module.exports = router;