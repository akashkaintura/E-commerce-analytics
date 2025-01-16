import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { errorHandler } from './middleware/errorMiddleware';
import { connectDatabase } from './config/database';
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import { logger } from './services/loggingService';

// Swagger configuration
const swaggerOptions: swaggerJsdoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'E-Commerce API',
            version: '1.0.0',
            description: 'E-Commerce API Documentation'
        },
        servers: [
            {
                url: process.env.API_URL || 'http://localhost:3000/api'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        }
    },
    apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Load environment variables
dotenv.config();

class Server {
    public app: express.Application;

    constructor() {
        this.app = express();
        this.initializeMiddlewares();
        this.initializeSwagger();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }

    private initializeMiddlewares() {
        this.app.use(helmet());
        this.app.use(cors({
            origin: process.env.CORS_ORIGIN || '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));

        this.app.use((req, res, next) => {
            logger.info(`${req.method} ${req.path}`, {
                method: req.method,
                path: req.path,
                body: req.body
            });
            next();
        });

        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }

    private initializeSwagger() {
        this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

        this.app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'OK',
                timestamp: new Date().toISOString()
            });
        });
    }

    private initializeRoutes() {
        this.app.use('/auth', authRoutes);
        this.app.use('/products', productRoutes);
        this.app.use('/orders', orderRoutes);
    }

    private initializeErrorHandling() {
        this.app.use(errorHandler);
    }

    public async start() {
        const PORT = process.env.PORT || 3000;

        try {
            // Connect to database
            await connectDatabase();

            // Start server
            const server = this.app.listen(PORT, () => {
                logger.info(`Server running on port ${PORT}`);
                logger.info(`Swagger docs available at http://localhost:${PORT}/api-docs`);
            });

            // Graceful shutdown
            process.on('SIGTERM', () => {
                logger.info('SIGTERM received. Shutting down gracefully');
                server.close(() => {
                    logger.info('Server closed');
                    process.exit(0);
                });
            });
        } catch (error) {
            logger.error('Failed to start server', { error });
            process.exit(1);
        }
    }
}

// Initialize and start server
const server = new Server();
server.start();

export { server };