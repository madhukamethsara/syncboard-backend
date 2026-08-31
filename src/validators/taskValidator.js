const { z } = require("zod");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectId = z.string().regex(objectIdRegex, "Invalid ID");
const dueDate = z.string().trim().refine((value) => !Number.isNaN(Date.parse(value)), "Invalid due date");
const labels = z.array(z.string().trim().min(1).max(60)).max(10);
const attachments = z.array(z.string().trim().url("Attachment must be a valid URL").max(500)).max(10);

const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Task title is required").max(150, "Task title cannot exceed 150 characters"),
  description: z.string().trim().max(1000, "Description cannot exceed 1000 characters").optional().default(""),
  boardId: objectId,
  columnId: objectId,
  assignedTo: objectId.nullable().optional().default(null),
  priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
  dueDate: z.union([dueDate, z.literal("")]).nullable().optional().default(null),
  labels: labels.optional().default([]),
  attachments: attachments.optional().default([]),
});

const updateTaskSchema = z.object({
  title: z.string().trim().min(1, "Task title is required").max(150, "Task title cannot exceed 150 characters").optional(),
  description: z.string().trim().max(1000, "Description cannot exceed 1000 characters").optional(),
  assignedTo: objectId.nullable().optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  dueDate: z.union([dueDate, z.literal("")]).nullable().optional(),
  columnId: objectId.optional(),
  position: z.number().int().min(0).optional(),
  labels: labels.optional(),
  attachments: attachments.optional(),
}).refine((data) => Object.keys(data).length > 0, "At least one task field is required");

module.exports = {
  createTaskSchema,
  updateTaskSchema,
};
