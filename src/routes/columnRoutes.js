const express = require("express");

const {
  createColumn,
  getBoardColumns,
  updateColumn,
  deleteColumn,
} = require("../controllers/columnController");

const authenticate = require("../middleware/authmiddleware");

const router = express.Router();

router.post("/", authenticate, createColumn);
router.patch("/:columnId", authenticate, updateColumn);
router.delete("/:columnId", authenticate, deleteColumn);

router.get(
  "/board/:boardId",
  authenticate,
  getBoardColumns
);

module.exports = router;