const { z } = require("zod");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Task title is required")
    .max(150, "Task title cannot exceed 150 characters"),

  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional()
    .default(""),

  boardId: z
    .string()
    .regex(objectIdRegex, "Invalid board ID"),

  columnId: z
    .string()
    .regex(objectIdRegex, "Invalid column ID"),

  assignedTo: z
    .string()
    .regex(objectIdRegex, "Invalid user ID")
    .nullable()
    .optional(),

  priority: z
    .enum(["low", "medium", "high"])
    .optional()
    .default("medium"),

  dueDate: z
    .string()
    .datetime()
    .nullable()
    .optional(),
});

const updateTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Task title is required")
    .max(150, "Task title cannot exceed 150 characters")
    .optional(),

  description: z
    .string()
    .trim()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional(),

  assignedTo: z
    .string()
    .regex(objectIdRegex, "Invalid user ID")
    .nullable()
    .optional(),

  priority: z
    .enum(["low", "medium", "high"])
    .optional(),

  dueDate: z
    .string()
    .datetime()
    .nullable()
    .optional(),

  columnId: z
    .string()
    .regex(objectIdRegex, "Invalid column ID")
    .optional(),

  position: z
    .number()
    .int()
    .min(0)
    .optional(),
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
};