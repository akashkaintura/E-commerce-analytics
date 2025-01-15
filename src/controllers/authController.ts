// src/controllers/authController.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorMiddleware';
import { getDatabase } from '../config/database';
import bcrypt from 'bcrypt';
import { registerSchema, loginSchema } from '../validators/authValidator';
import jwt from 'jsonwebtoken';
import { users } from '../models/schema';
import { sql } from 'drizzle-orm';

// Enum for user roles
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MANAGER = 'manager'
}

export const registerUser = async (req: Request, res: Response) => {
    // Validate input using Zod schema
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new AppError('Validation failed', 400);
    }

    const { username, password, email, role } = parsed.data;

    const db = getDatabase();
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        // Check if user already exists
        const existingUser = await db.select()
            .from(users)
            .where(
                sql`username = ${username} OR email = ${email}`
            )
            .limit(1)
            .execute();

        if (existingUser.length > 0) {
            throw new AppError('User already exists', 409);
        }

        // Create new user with role (default to 'user')
        const newUser = await db.insert(users).values({
            username,
            password: hashedPassword,
            email,
            role: role || UserRole.USER, // Default to 'user' if no role specified
        }).returning();

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: newUser[0].id, 
                username: newUser[0].username, 
                role: newUser[0].role 
            }, 
            process.env.JWT_SECRET!, 
            { expiresIn: '1h' }
        );

        res.status(201).json({
            status: 'success',
            data: {
                user: {
                    id: newUser[0].id,
                    username: newUser[0].username,
                    email: newUser[0].email,
                    role: newUser[0].role
                },
                token,
            },
        });
    } catch (error) {
        throw new AppError(
            error.message || 'User registration failed', 
            error.statusCode || 400
        );
    }
};

export const loginUser = async (req: Request, res: Response) => {
    // Validate input using Zod schema
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        throw new AppError('Validation failed', 400);
    }

    const { username, password } = parsed.data;

    const db = getDatabase();
    const user = await db.select().from(users).where({ username }).first();

    if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new AppError('Invalid credentials', 401);
    }

    // Generate JWT token with role
    const token = jwt.sign(
        { 
            id: user.id, 
            username: user.username, 
            role: user.role 
        }, 
        process.env.JWT_SECRET!, 
        { expiresIn: '1h' }
    );

    res.status(200).json({
        status: 'success',
        data: {
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            },
            token,
        },
    });
};

// Role-based Authorization Middleware
export const authorizeRoles = (...allowedRoles: UserRole[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        // Assuming token verification middleware populates req.user
        const userRole = (req as any).user?.role;

        if (!userRole || !allowedRoles.includes(userRole as UserRole)) {
            return res.status(403).json({ 
                status: 'error',
                message: 'Access denied' 
            });
        }

        next();
    };
};

// Token Verification Middleware
export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ 
            status: 'error', 
            message: 'No token provided' 
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { 
            id: number, 
            username: string, 
            role: UserRole 
        };
        
        // Attach user information to request
        (req as any).user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ 
            status: 'error', 
            message: 'Invalid token' 
        });
    }
};