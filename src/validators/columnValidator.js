const { z } = require("zod");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const createColumnSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Column name is required")
    .max(100, "Column name cannot exceed 100 characters"),

  boardId: z
    .string()
    .regex(objectIdRegex, "Invalid board ID"),
});

const updateColumnSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Column name is required")
    .max(100, "Column name cannot exceed 100 characters")
    .optional(),

  position: z
    .number()
    .int()
    .min(0)
    .optional(),
});

module.exports = {
  createColumnSchema,
  updateColumnSchema,
};