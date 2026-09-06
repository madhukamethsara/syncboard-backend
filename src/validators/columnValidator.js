const { z } = require("zod");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const boardIdSchema = z
  .string()
  .trim()
  .regex(objectIdRegex, "Invalid board ID");

const columnNameSchema = z
  .string()
  .trim()
  .min(1, "Column name is required")
  .max(100, "Column name cannot exceed 100 characters");

const createColumnSchema = z
  .object({
    name: columnNameSchema,
    boardId: boardIdSchema,
  })
  .strict();

const updateColumnSchema = z
  .object({
    name: columnNameSchema.optional(),
    position: z
      .number()
      .finite("Position must be a valid number")
      .int("Position must be a whole number")
      .min(0, "Position cannot be negative")
      .optional(),
  })
  .strict()
  .refine(
    (data) => data.name !== undefined || data.position !== undefined,
    {
      message: "Provide a column name or position to update",
    }
  );

module.exports = {
  createColumnSchema,
  updateColumnSchema,
};