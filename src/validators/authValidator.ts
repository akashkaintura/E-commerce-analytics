import { z } from 'zod';

const usernameSchema = z.string()
    .min(3, { message: "Username must be at least 3 characters long" })
    .max(50, { message: "Username must be no more than 50 characters long" })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores" });

const emailSchema = z.string()
    .email({ message: "Invalid email address" })
    .max(100, { message: "Email must be no more than 100 characters long" });

const passwordSchema = z.string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, {
        message: "Password must include uppercase, lowercase, number, and special character"
    });

export const registerSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(['user', 'admin', 'manager']).optional()
});

export const loginSchema = z.object({
    username: z.string(),
    password: z.string()
});

export const updateProfileSchema = z.object({
    email: emailSchema.optional(),
    password: passwordSchema.optional()
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;