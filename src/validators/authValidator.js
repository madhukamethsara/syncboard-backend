const {z} = require("zod")

const registerSchema = z.object({
    name : z
        .string()
        .min(2 , "Name must be at least 2 characters")
        .max(50 , "Name is too long"),


    email : z
        .string()
        .email("Please enter a valid email"),

    password : z
        .string()
        .min(8,"Password must be least 8 characters"),

});

const loginSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email"),

  password: z
    .string()
    .min(1, "Password is required"),
});

module.exports = {
    registerSchema,
    loginSchema,
};