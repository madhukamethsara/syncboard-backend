const { z } = require("zod");

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const createBoardSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Board name must be at least 2 characters")
    .max(100, "Board name cannot exceed 100 characters"),

  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .default(""),

  teamId: z
    .string()
    .regex(objectIdRegex, "Invalid team ID")
    .nullable()
    .optional(),
});

const updateBoardSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Board name must be at least 2 characters")
    .max(100, "Board name cannot exceed 100 characters")
    .optional(),

  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),
}).refine((data) => Object.keys(data).length > 0, "At least one board field is required");

module.exports = {
  createBoardSchema,
  updateBoardSchema,
};
