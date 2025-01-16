import express, { ErrorRequestHandler } from 'express';
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

dotenv.config();

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
                url: process.env.API_URL || 'http://localhost:3000'
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

class Server {
    public app: express.Application;

    constructor() {
        this.app = express();
        this.initializeMiddlewares();
        this.initializeSwagger();
        this.initializeRoutes();
        this.initializeErrorHandling();
        this.initializeRootRoutes();
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
    }

    private initializeRootRoutes() {
        // Root route
        this.app.get('/', (req, res) => {
            res.json({
                message: 'Welcome to E-Commerce API',
                docs: '/api-docs'
            });
        });

        // Health check route
        this.app.get('/health', (req, res) => {
            res.status(200).json({
                status: 'OK',
                timestamp: new Date().toISOString()
            });
        });
    }

    private initializeRoutes() {
        console.log('Initializing Routes');

        const apiRouter = express.Router();
        apiRouter.use('/auth', authRoutes);
        console.log('Auth routes mounted');
        this.app.use('/products', productRoutes);
        this.app.use('/orders', orderRoutes);

        this.app.use('/api', apiRouter);

        this.app.use((req, res, next) => {
            console.log(`Received request: ${req.method} ${req.path}`);
            next();
        });
    }

    private initializeErrorHandling() {
        this.app.use(errorHandler);
    }

    public async start() {
        const PORT = process.env.PORT || 3000;

        try {
            await connectDatabase();

            const server = this.app.listen(PORT, () => {
                logger.info(`Server running on port ${PORT}`);
                logger.info(`Swagger docs available at http://localhost:${PORT}/api-docs`);
                logger.info(`API routes prefix: /api`);
            });
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

const server = new Server();
server.start();

export { server };