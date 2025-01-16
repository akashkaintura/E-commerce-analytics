import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../config/database';
import { users } from '../models/schema';
import { AppError } from '../middleware/errorMiddleware';
import { sql } from 'drizzle-orm';

export enum UserRole {
    ADMIN = 'admin',
    USER = 'user',
    MANAGER = 'manager'
}

export interface UserCreateDTO {
    username: string;
    email: string;
    password: string;
    role?: UserRole;
}

export interface UserLoginDTO {
    username: string;
    password: string;
}

export class AuthService {
    static async registerUser(userData: UserCreateDTO) {
        const db = getDatabase();

        const existingUser = await db.select()
            .from(users)
            .where(
                sql`username = ${userData.username} OR email = ${userData.email}`
            )
            .limit(1)
            .execute();

        if (existingUser.length > 0) {
            throw new AppError('User already exists', 409);
        }

        const hashedPassword = await bcrypt.hash(userData.password, 10);

        const [newUser] = await db.insert(users).values({
            username: userData.username,
            email: userData.email,
            password: hashedPassword,
            role: userData.role || UserRole.USER
        }).returning();

        return newUser;
    }

    static async loginUser(loginData: UserLoginDTO) {
        const db = getDatabase();

        const [user] = await db.select()
            .from(users)
            .where(sql`username = ${loginData.username}`)
            .limit(1)
            .execute();

        if (!user) {
            throw new AppError('Invalid credentials', 401);
        }

        const isPasswordValid = await bcrypt.compare(
            loginData.password,
            user.password
        );

        if (!isPasswordValid) {
            throw new AppError('Invalid credentials', 401);
        }

        return this.generateTokens(user);
    }

    static generateTokens(user: any) {
        const accessToken = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role
            },
            process.env.JWT_SECRET!,
            { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
            {
                id: user.id,
                username: user.username
            },
            process.env.REFRESH_TOKEN_SECRET!,
            { expiresIn: '7d' }
        );

        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        };
    }

    static async refreshToken(refreshToken: string) {
        try {
            const decoded = jwt.verify(
                refreshToken,
                process.env.REFRESH_TOKEN_SECRET!
            ) as { id: number, username: string };

            const db = getDatabase();

            const [user] = await db.select()
                .from(users)
                .where(sql`id = ${decoded.id}`)
                .limit(1)
                .execute();

            if (!user) {
                throw new AppError('Invalid refresh token', 401);
            }

            return this.generateTokens(user);
        } catch (error) {
            throw new AppError('Token refresh failed', 401);
        }
    }

    static async getUserProfile(userId: number) {
        const db = getDatabase();

        const [user] = await db.select({
            id: users.id,
            username: users.username,
            email: users.email,
            role: users.role
        })
            .from(users)
            .where(sql`id = ${userId}`)
            .limit(1)
            .execute();

        if (!user) {
            throw new AppError('User not found', 404);
        }

        return user;
    }

    static async updateUserProfile(
        userId: number,
        updateData: Partial<{
            email: string;
            password: string;
        }>
    ) {
        const db = getDatabase();

        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }

        const [updatedUser] = await db.update(users)
            .set(updateData)
            .where(sql`id = ${userId}`)
            .returning({
                id: users.id,
                username: users.username,
                email: users.email
            });

        return updatedUser;
    }
}