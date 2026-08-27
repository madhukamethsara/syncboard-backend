const { z } = require("zod");

const createTeamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Team name must be at least 2 characters")
    .max(100, "Team name must be less than 100 characters"),
});

const updateTeamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Team name must be at least 2 characters")
    .max(100, "Team name must be less than 100 characters"),
});

const updateMemberRoleSchema = z.object({
  role: z.enum(["admin", "member"]),
});

const createInvitationSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .transform((email) => email.toLowerCase()),

  role: z
    .enum(["admin", "member"])
    .default("member"),
});

module.exports = {
  createTeamSchema,
  updateTeamSchema,
  updateMemberRoleSchema,
  createInvitationSchema,
};