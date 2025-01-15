import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorMiddleware';
import { connectDatabase } from './config/database';
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import logger from './utils/logger';




// Load environment variables
dotenv.config();

class Server {
    public app: express.Application;

    constructor() {
        this.app = express();
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }

    private initializeMiddlewares() {
        // Security middlewares
        this.app.use(helmet());
        this.app.use(cors({
            origin: process.env.CORS_ORIGIN || '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization']
        }));

        // Parse JSON bodies
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }

    private initializeRoutes() {
        // Placeholder for route imports
        this.app.use('/api/auth', authRoutes);
        this.app.use('/api/products', productRoutes);
        this.app.use('/api/orders', orderRoutes);
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
            this.app.listen(PORT, () => {
                console.log(`Server running on port ${PORT}`);
            });
        } catch (error) {
            console.error('Failed to start server:', error);
            process.exit(1);
        }
    }
}

// Initialize and start server
const server = new Server();
server.start();