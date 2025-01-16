import { z } from 'zod';

// Username validation
const usernameSchema = z.string()
    .min(3, { message: "Username must be at least 3 characters long" })
    .max(50, { message: "Username must be no more than 50 characters long" })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores" });

// Email validation
const emailSchema = z.string()
    .email({ message: "Invalid email address" })
    .max(100, { message: "Email must be no more than 100 characters long" });

// Password validation
const passwordSchema = z.string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, {
        message: "Password must include uppercase, lowercase, number, and special character"
    });

// Registration schema
export const registerSchema = z.object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    role: z.enum(['admin', 'user', 'manager']).optional()
});

// Login schema
export const loginSchema = z.object({
    username: usernameSchema,
    password: z.string()
});

// Update profile schema
export const updateProfileSchema = z.object({
    email: emailSchema.optional(),
    password: passwordSchema.optional()
});

// Export types for TypeScript
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;