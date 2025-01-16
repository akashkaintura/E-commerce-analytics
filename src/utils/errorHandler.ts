import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../services/loggingService';

class AppError extends Error {
    statusCode: number;
    status: string;
    isOperational: boolean;

    constructor(message: string, statusCode: number) {
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

const errorHandler = (
    err: Error | AppError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let error = err as AppError;
    error.message = err.message;

    // Log the error
    logger.error('Error occurred', {
        message: error.message,
        stack: error.stack,
        method: req.method,
        path: req.path
    });

    if (err instanceof ZodError) {
        const errors = err.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
        }));

        return res.status(400).json({
            status: 'fail',
            errors
        });
    }

    // Database Unique Constraint Error
    if (err.name === 'UniqueConstraintError') {
        return res.status(409).json({
            status: 'fail',
            message: 'A record with this unique identifier already exists'
        });
    }

    // JWT Authentication Errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            status: 'fail',
            message: 'Invalid token. Please log in again.'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            status: 'fail',
            message: 'Token expired. Please log in again.'
        });
    }

    // Custom App Error
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    }

    // Default Server Error
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
        status: 'error',
        message: process.env.NODE_ENV === 'production'
            ? 'Something went wrong'
            : error.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
    });
};

export {
    AppError,
    errorHandler
};