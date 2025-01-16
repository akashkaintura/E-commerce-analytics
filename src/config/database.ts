import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../models/schema';


let db: ReturnType<typeof drizzle>;
let connectionPool: Pool;

export const connectDatabase = async () => {
    try {
        connectionPool = new Pool({
            connectionString: process.env.DATABASE_URL,
        });

        // Test connection
        await connectionPool.connect();
        console.log('Database connection established successfully');

        // Initialize Drizzle ORM
        return drizzle(connectionPool, { schema });
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
};

export const getDatabase = () => {
    if (!connectionPool) {
        throw new Error('Database not initialized');
    }
    return drizzle(connectionPool);
};