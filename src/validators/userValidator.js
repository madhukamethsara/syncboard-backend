const { z } = require("zod");

const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .optional(),

  avatar: z
    .string()
    .trim()
    .url("Avatar must be a valid URL")
    .max(500, "Avatar URL is too long")
    .optional()
    .or(z.literal("")),
});

const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, "Current password is required"),

    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),

    confirmPassword: z
      .string()
      .min(1, "Please confirm your new password"),
  })
  .refine(
    (data) => data.newPassword === data.confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }
  );
module.exports = {
  updateProfileSchema,
  changePasswordSchema,
};