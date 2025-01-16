import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/errorMiddleware';
import { getDatabase } from '../config/database';
import bcrypt from 'bcrypt';
import { registerSchema, loginSchema } from '../validators/authValidator';
import jwt from 'jsonwebtoken';
import { users } from '../models/schema';
import { sql, eq } from 'drizzle-orm';

export enum UserRole {
    ADMIN = 'admin',
    USER = 'user',
    MANAGER = 'manager'
}


interface TokenPayload {
    id: number;
    username: string;
    role: UserRole;
}

export class AuthController {

    static generateAccessToken(user: TokenPayload): string {
        return jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role
            },
            process.env.JWT_SECRET!,
            { expiresIn: '15m' }
        );
    }


    static generateRefreshToken(user: TokenPayload): string {
        return jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role
            },
            process.env.JWT_REFRESH_SECRET!,
            { expiresIn: '7d' }
        );
    }


    static async registerUser(req: Request, res: Response) {

        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new AppError('Validation failed', 400);
        }

        const { username, password, email, role } = parsed.data;

        const db = getDatabase();
        const hashedPassword = await bcrypt.hash(password, 10);

        try {
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

            const newUser = await db.insert(users).values({
                username,
                password: hashedPassword,
                email,
                role: role || UserRole.USER,
            }).returning();

            const accessToken = this.generateAccessToken({
                id: newUser[0].id,
                username: newUser[0].username,
                role: newUser[0].role as UserRole || UserRole.USER
            });

            const refreshToken = this.generateRefreshToken({
                id: newUser[0].id,
                username: newUser[0].username,
                role: newUser[0].role as UserRole || UserRole.USER
            });

            res.status(201).json({
                status: 'success',
                data: {
                    user: {
                        id: newUser[0].id,
                        username: newUser[0].username,
                        email: newUser[0].email,
                        role: newUser[0].role
                    },
                    accessToken,
                    refreshToken,
                },
            });
        } catch (error) {
            throw new AppError(
                error instanceof Error ? error.message : 'User registration failed',
                (error as any)?.statusCode || 400
            );
        }
    }

    static async loginUser(req: Request, res: Response) {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            throw new AppError('Validation failed', 400);
        }

        const { username, password } = parsed.data;

        const db = getDatabase();
        const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new AppError('Invalid credentials', 401);
        }

        const accessToken = this.generateAccessToken({
            id: user.id,
            username: user.username,
            role: user.role as UserRole
        });

        const refreshToken = this.generateRefreshToken({
            id: user.id,
            username: user.username,
            role: user.role as UserRole
        });

        res.status(200).json({
            status: 'success',
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                },
                accessToken,
                refreshToken,
            },
        });
    }

    static async refreshToken(req: Request, res: Response, next: NextFunction) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return next(new AppError('Refresh token required', 400));
            }

            try {
                const decoded = jwt.verify(
                    refreshToken,
                    process.env.JWT_REFRESH_SECRET!
                ) as TokenPayload;

                const newAccessToken = this.generateAccessToken({
                    id: decoded.id,
                    username: decoded.username,
                    role: decoded.role
                });

                res.status(200).json({
                    status: 'success',
                    data: {
                        accessToken: newAccessToken
                    }
                });
            } catch (error) {
                return next(new AppError('Invalid refresh token', 401));
            }
        } catch (error) {
            next(error);
        }
    }


    static async verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const authHeader = req.headers.authorization;

            if (!authHeader) {
                return next(new AppError('No token provided', 401));
            }

            const token = authHeader.split(' ')[1];

            if (!token) {
                return next(new AppError('Invalid token format', 401));
            }

            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;

                (req as any).user = decoded;
                next();
            } catch (verifyError) {
                if (verifyError instanceof jwt.TokenExpiredError) {
                    return next(new AppError('Token expired', 401));
                }
                return next(new AppError('Invalid token', 401));
            }
        } catch (error) {
            next(error);
        }
    }

    static authorizeRoles = (...allowedRoles: UserRole[]) => {
        return (req: Request, res: Response, next: NextFunction) => {
            const userRole = (req as any).user?.role;

            if (!userRole || !allowedRoles.includes(userRole)) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Access denied'
                });
            }

            next();
        };
    }
}

declare global {
    namespace Express {
        interface Request {
            user?: TokenPayload;
        }
    }
}

export const {
    registerUser,
    loginUser,
    authorizeRoles,
    verifyToken
} = AuthController;