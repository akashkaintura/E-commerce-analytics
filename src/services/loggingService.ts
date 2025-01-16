import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { Request, Response, NextFunction } from 'express';

export enum LogLevel {
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    DEBUG = 'debug'
}

export interface LogEntry {
    level: LogLevel;
    message: string;
    metadata?: Record<string, any>;
}

class LoggingService {
    private logger: winston.Logger;

    constructor() {
        const logDir = path.join(process.cwd(), 'logs');

        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL || 'info',
            format: winston.format.combine(
                winston.format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss'
                }),
                winston.format.errors({ stack: true }),
                winston.format.splat(),
                winston.format.json()
            ),
            defaultMeta: { service: 'main-service' },
            transports: [
                new winston.transports.Console({
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.simple()
                    )
                }),

                new DailyRotateFile({
                    filename: path.join(logDir, 'error-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    level: 'error',
                    maxSize: '20m',
                    maxFiles: '14d'
                }),

                new DailyRotateFile({
                    filename: path.join(logDir, 'combined-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    maxSize: '20m',
                    maxFiles: '14d'
                })
            ],
            exceptionHandlers: [
                new winston.transports.File({
                    filename: path.join(logDir, 'exceptions.log')
                })
            ],
            rejectionHandlers: [
                new winston.transports.File({
                    filename: path.join(logDir, 'rejections.log')
                })
            ]
        });
    }

    error(message: string, metadata?: Record<string, any>): void {
        this.logger.error(message, metadata);
    }

    warn(message: string, metadata?: Record<string, any>): void {
        this.logger.warn(message, metadata);
    }

    info(message: string, metadata?: Record<string, any>): void {
        this.logger.info(message, metadata);
    }

    debug(message: string, metadata?: Record<string, any>): void {
        this.logger.debug(message, metadata);
    }

    log(entry: LogEntry): void {
        this.logger.log({
            level: entry.level,
            message: entry.message,
            ...entry.metadata
        });
    }

    child(context: Record<string, any>): winston.Logger {
        return this.logger.child(context);
    }

    httpLogger() {
        return (req: Request, res: Response, next: NextFunction) => {
            const startTime = Date.now();

            this.info(`Request: ${req.method} ${req.url}`, {
                method: req.method,
                url: req.url,
                body: req.body,
                query: req.query,
                ip: req.ip
            });

            const originalEnd = res.end;

            res.end = ((chunk?: any, encoding?: BufferEncoding) => {
                const duration = Date.now() - startTime;

                this.logger.info(`Response: ${req.method} ${req.url}`, {
                    method: req.method,
                    url: req.url,
                    statusCode: res.statusCode,
                    duration: `${duration}ms`
                });

                return originalEnd.call(res, chunk, encoding || 'utf8');
            }) as any;

            next();
        };
    }

    errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
        this.error('Unhandled Error', {
            error: err.message,
            stack: err.stack,
            method: req.method,
            url: req.url
        });

        res.statusCode = 500;
        res.json({
            status: 'error',
            message: 'An unexpected error occurred'
        });
    }
}

export const logger = new LoggingService();
