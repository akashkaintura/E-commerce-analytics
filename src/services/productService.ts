import { getDatabase } from '../config/database';
import { products } from '../models/schema';
import { AppError } from '../middleware/errorMiddleware';
import { sql } from 'drizzle-orm';
import { CacheService } from './cacheService';

export interface ProductCreateDTO {
    name: string;
    description?: string;
    price: number;
    stock: number;
    categoryId?: number;
}

export interface ProductSearchOptions {
    query?: string;
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
}

export class ProductService {
    // Create Product
    static async createProduct(productData: ProductCreateDTO) {
        const db = getDatabase();

        // Validate input
        if (productData.stock < 0) {
            throw new AppError('Stock cannot be negative', 400);
        }

        const [newProduct] = await db.insert(products).values(productData).returning();

        await CacheService.invalidateCache('products');

        return newProduct;
    }

    static async getProductById(productId: number) {
        const db = getDatabase();

        // Try to get from cache first
        const cachedProduct = await CacheService.get(`products:${productId}`);
        if (cachedProduct) return cachedProduct;

        const [product] = await db.select()
            .from(products)
            .where(sql`id = ${productId}`)
            .limit(1)
            .execute();

        if (!product) {
            throw new AppError('Product not found', 404);
        }

        // Cache the product
        await CacheService.set(`products:${productId}`, product);

        return product;
    }

    // Update Product
    static async updateProduct(
        productId: number,
        updateData: Partial<ProductCreateDTO>
    ) {
        const db = getDatabase();

        // Validate stock if provided
        if (updateData.stock && updateData.stock < 0) {
            throw new AppError('Stock cannot be negative', 400);
        }

        const [updatedProduct] = await db.update(products)
            .set(updateData)
            .where(sql`id = ${productId}`)
            .returning();

        if (!updatedProduct) {
            throw new AppError('Product not found', 404);
        }

        // Invalidate cache
        await CacheService.invalidateCache(`products:${productId}`);

        return updatedProduct;
    }

    // Delete Product
    static async deleteProduct(productId: number) {
        const db = getDatabase();

        const [deletedProduct] = await db.delete(products)
            .where(sql`id = ${productId}`)
            .returning();

        if (!deletedProduct) {
            throw new AppError('Product not found', 404);
        }

        // Invalidate cache
        await CacheService.invalidateCache(`products:${productId}`);

        return deletedProduct;
    }

    // Search Products
    static async searchProducts(options: ProductSearchOptions) {
        const db = getDatabase();
        const { query, categoryId, minPrice, maxPrice, page = 1, limit = 10 } = options;

        let conditions = sql`TRUE`;
        
        if (query) {
            conditions = sql`${conditions} and name ILIKE ${`%${query}%`}`;
        }
        if (categoryId) {
            conditions = sql`${conditions} and category_id = ${categoryId}`;
        }
        if (minPrice !== undefined) {
            conditions = sql`${conditions} and price >= ${minPrice}`;
        }
        if (maxPrice !== undefined) {
            conditions = sql`${conditions} and price <= ${maxPrice}`;
        }

        const queryBuilder = db.select()
            .from(products)
            .where(conditions);

        const productsList = await queryBuilder
            .limit(limit)
            .offset((page - 1) * limit)
            .execute();

        return productsList;
    }
}