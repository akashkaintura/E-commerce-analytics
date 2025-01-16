import Redis from 'ioredis';

export interface CacheOptions {
    expiration?: number;
    prefix?: string;
}

export class CacheService {
    private static instance: Redis;

    private static getInstance(): Redis {
        if (!CacheService.instance) {
            CacheService.instance = new Redis({
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT || '6379'),
                password: process.env.REDIS_PASSWORD
            });

            CacheService.instance.on('error', (error) => {
                console.error('Redis Connection Error:', error);
            });
        }
        return CacheService.instance;
    }

    static async set(
        key: string,
        value: any,
        options: CacheOptions = {}
    ): Promise<void> {
        const {
            expiration = 3600,
            prefix = 'app'
        } = options;

        const redis = CacheService.getInstance();
        const formattedKey = `${prefix}:${key}`;

        try {
            await redis.set(
                formattedKey,
                JSON.stringify(value),
                'EX',
                expiration
            );
        } catch (error) {
            console.error('Cache Set Error:', error);
        }
    }

    static async get<T = any>(
        key: string,
        options: { prefix?: string } = {}
    ): Promise<T | null> {
        const { prefix = 'app' } = options;
        const redis = CacheService.getInstance();
        const formattedKey = `${prefix}:${key}`;

        try {
            const cachedValue = await redis.get(formattedKey);
            return cachedValue ? JSON.parse(cachedValue) : null;
        } catch (error) {
            console.error('Cache Get Error:', error);
            return null;
        }
    }

    static async invalidateCache(
        key: string,
        options: { prefix?: string } = {}
    ): Promise<void> {
        const { prefix = 'app' } = options;
        const redis = CacheService.getInstance();

        try {
            const formattedKey = key.includes('*')
                ? `${prefix}:${key}`
                : `${prefix}:${key}*`;

            const keys = await redis.keys(formattedKey);

            if (keys.length > 0) {
                await redis.del(...keys);
            }
        } catch (error) {
            console.error('Cache Invalidation Error:', error);
        }
    }

    static async delete(
        key: string,
        options: { prefix?: string } = {}
    ): Promise<void> {
        const { prefix = 'app' } = options;
        const redis = CacheService.getInstance();
        const formattedKey = `${prefix}:${key}`;

        try {
            await redis.del(formattedKey);
        } catch (error) {
            console.error('Cache Delete Error:', error);
        }
    }

    static async increment(
        key: string,
        by: number = 1,
        options: CacheOptions = {}
    ): Promise<number> {
        const {
            expiration = 3600,
            prefix = 'app'
        } = options;

        const redis = CacheService.getInstance();
        const formattedKey = `${prefix}:${key}`;

        try {
            const result = await redis.incrby(formattedKey, by);

            await redis.expire(formattedKey, expiration);

            return result;
        } catch (error) {
            console.error('Cache Increment Error:', error);
            return 0;
        }
    }

    static async memoize<T>(
        key: string,
        fetchFunction: () => Promise<T>,
        options: CacheOptions = {}
    ): Promise<T> {
        const {
            expiration = 3600,
            prefix = 'app'
        } = options;

        const cachedValue = await CacheService.get<T>(key, { prefix });
        if (cachedValue !== null) {
            return cachedValue;
        }

        const freshData = await fetchFunction();

        await CacheService.set(key, freshData, {
            expiration,
            prefix
        });

        return freshData;
    }

    static async clearPrefix(prefix: string): Promise<void> {
        const redis = CacheService.getInstance();

        try {
            const keys = await redis.keys(`${prefix}:*`);
            if (keys.length > 0) {
                await redis.del(...keys);
            }
        } catch (error) {
            console.error('Cache Clear Prefix Error:', error);
        }
    }

    static async exists(
        key: string,
        options: { prefix?: string } = {}
    ): Promise<boolean> {
        const { prefix = 'app' } = options;
        const redis = CacheService.getInstance();
        const formattedKey = `${prefix}:${key}`;

        try {
            const exists = await redis.exists(formattedKey);
            return exists === 1;
        } catch (error) {
            console.error('Cache Exists Check Error:', error);
            return false;
        }
    }
}