import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}

export const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error('Error Handling Middleware:', err);

    if (err instanceof ZodError) {
        return res.status(400).json({
            status: 'error',
            errors: err.errors.map(e => ({
                path: e.path.join('.'),
                message: e.message
            }))
        });
    }

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: 'error',
            message: err.message
        });
    }

    res.status(500).json({
        status: 'error',
        message: 'Internal Server Error'
    });
};