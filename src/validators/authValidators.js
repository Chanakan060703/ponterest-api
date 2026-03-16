import { z } from "zod";

const registerSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters long"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 digits long"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
});

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
});

export { registerSchema, loginSchema };