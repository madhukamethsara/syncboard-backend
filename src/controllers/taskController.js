const Task = require("../models/Task");
const Board = require("../models/Board");
const Column = require("../models/Column");
const { createTaskSchema, updateTaskSchema } = require("../validators/taskValidator");
const { getBoardPermission, isBoardAssignee, isValidId } = require("../utils/boardAccess");

const boardQuery = (id) => Board.findById(id).populate("team", "owner members");
const populateTask = (query) => query
  .populate("assignedTo", "name email avatar")
  .populate("createdBy", "name email avatar")
  .populate("column", "name position")
  .populate("comments.user", "name email avatar");

const validationError = (res, result) => res.status(400).json({ success: false, message: "Validation failed", errors: result.error.flatten().fieldErrors });

async function taskAndBoard(taskId) {
  if (!isValidId(taskId)) return {};
  const task = await Task.findById(taskId);
  if (!task) return {};
  const board = await boardQuery(task.board);
  return { task, board };
}

const createTask = async (req, res) => {
  try {
    const result = createTaskSchema.safeParse(req.body);
    if (!result.success) return validationError(res, result);
    const data = result.data;
    const board = await boardQuery(data.boardId);
    if (!board) return res.status(404).json({ success: false, message: "Board not found" });
    if (!getBoardPermission(board, req.user._id).canEdit) return res.status(403).json({ success: false, message: "You do not have access to this board" });
    const column = await Column.findOne({ _id: data.columnId, board: board._id });
    if (!column) return res.status(400).json({ success: false, message: "Column does not belong to this board" });
    if (!isBoardAssignee(board, data.assignedTo)) return res.status(400).json({ success: false, message: "Assignee must be a member of this board" });

    const lastTask = await Task.findOne({ column: column._id }).sort({ position: -1 });
    const task = await Task.create({
      title: data.title,
      description: data.description,
      board: board._id,
      column: column._id,
      assignedTo: data.assignedTo,
      createdBy: req.user._id,
      priority: data.priority,
      dueDate: data.dueDate || null,
      labels: data.labels,
      attachments: data.attachments,
      position: lastTask ? lastTask.position + 1 : 0,
    });
    return res.status(201).json({ success: true, message: "Task created successfully", task: await populateTask(Task.findById(task._id)) });
  } catch (error) {
    console.error("CREATE TASK ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to create task" });
  }
};

const getBoardTasks = async (req, res) => {
  try {
    if (!isValidId(req.params.boardId)) return res.status(400).json({ success: false, message: "Invalid board ID" });
    const board = await boardQuery(req.params.boardId);
    if (!board) return res.status(404).json({ success: false, message: "Board not found" });
    if (!getBoardPermission(board, req.user._id).canView) return res.status(403).json({ success: false, message: "You do not have access to this board" });
    const tasks = await populateTask(Task.find({ board: board._id }).sort({ position: 1, createdAt: 1 }));
    return res.json({ success: true, tasks });
  } catch (error) {
    console.error("GET TASKS ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to load tasks" });
  }
};

const updateTask = async (req, res) => {
  try {
    const result = updateTaskSchema.safeParse(req.body);
    if (!result.success) return validationError(res, result);
    const { task, board } = await taskAndBoard(req.params.taskId);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    if (!board || !getBoardPermission(board, req.user._id).canEdit) return res.status(403).json({ success: false, message: "You do not have permission to update this task" });
    const update = { ...result.data };
    if (Object.prototype.hasOwnProperty.call(update, "assignedTo") && !isBoardAssignee(board, update.assignedTo)) {
      return res.status(400).json({ success: false, message: "Assignee must be a member of this board" });
    }
    if (update.columnId) {
      const column = await Column.findOne({ _id: update.columnId, board: board._id });
      if (!column) return res.status(400).json({ success: false, message: "Column does not belong to this board" });
      if (task.column.toString() !== column._id.toString()) {
        const lastTask = await Task.findOne({ column: column._id, _id: { $ne: task._id } }).sort({ position: -1 });
        update.position = lastTask ? lastTask.position + 1 : 0;
      }
      update.column = update.columnId;
      delete update.columnId;
    }
    if (update.dueDate === "") update.dueDate = null;
    await Task.updateOne({ _id: task._id }, update, { runValidators: true });
    return res.json({ success: true, message: "Task updated successfully", task: await populateTask(Task.findById(task._id)) });
  } catch (error) {
    console.error("UPDATE TASK ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to update task" });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { task, board } = await taskAndBoard(req.params.taskId);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    if (!board || !getBoardPermission(board, req.user._id).canEdit) return res.status(403).json({ success: false, message: "You do not have permission to delete this task" });
    await Task.deleteOne({ _id: task._id });
    return res.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error("DELETE TASK ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to delete task" });
  }
};

const addTaskComment = async (req, res) => {
  try {
    const text = req.body.text?.trim();
    if (!text || text.length > 1000) return res.status(400).json({ success: false, message: "Comment must contain 1 to 1000 characters" });
    const { task, board } = await taskAndBoard(req.params.taskId);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });
    if (!board || !getBoardPermission(board, req.user._id).canView) return res.status(403).json({ success: false, message: "You do not have permission to comment on this task" });
    task.comments.push({ user: req.user._id, text });
    await task.save();
    const populated = await populateTask(Task.findById(task._id));
    return res.status(201).json({ success: true, message: "Comment added", comment: populated.comments.at(-1) });
  } catch (error) {
    console.error("ADD COMMENT ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to add comment" });
  }
};

module.exports = { createTask, getBoardTasks, updateTask, deleteTask, addTaskComment };
