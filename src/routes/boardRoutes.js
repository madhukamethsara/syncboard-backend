const express = require("express");
const { createBoard ,getMyBoards , getBoardById , updateBoard ,deleteBoard} = require("../controllers/boardController");
const authenticate = require("../middleware/authmiddleware");

const router = express.Router();

router.post("/", authenticate, createBoard);
router.get("/", authenticate, getMyBoards);
router.get("/:boardId", authenticate, getBoardById);
router.patch("/:boardId", authenticate, updateBoard);
router.delete("/:boardId", authenticate, deleteBoard);

module.exports = router;