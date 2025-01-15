// src/controllers/productController.ts
import { Request, Response } from 'express';
import { AppError } from '../middleware/errorMiddleware';
import { getDatabase } from '../config/database';
import { products } from '../models/schema';

export const createProduct = async (req: Request, res: Response) => {
    const { name, description, price, stock } = req.body;

    const db = getDatabase();

    try {
        const newProduct = await db.insert(products).values({
            name,
            description,
            price,
            stock,
        }).returning();

        res.status(201).json({
            status: 'success',
            data: {
                product: newProduct,
            },
        });
    } catch (error) {
        throw new AppError('Product creation failed', 400);
    }
};

export const getProducts = async (req: Request, res: Response) => {
    const db = getDatabase();

    try {
        const allProducts = await db.select().from(products);
        res.status(200).json({
            status: 'success',
            data: {
                products: allProducts,
            },
        });
    } catch (error) {
        throw new AppError('Failed to retrieve products', 500);
    }
};