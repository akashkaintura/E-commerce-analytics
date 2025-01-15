// src/controllers/orderController.ts
import { Request, Response } from 'express';
import { AppError } from '../middleware/errorMiddleware';
import { getDatabase } from '../config/database';
import { orders, products } from '../models/schema';

export const createOrder = async (req: Request, res: Response) => {
    const { userId, productId, quantity } = req.body;

    const db = getDatabase();

    try {
        const product = await db.select().from(products).where({ id: productId }).first();
        if (!product) {
            throw new AppError('Product not found', 404);
        }

        const totalPrice = product.price * quantity;

        const newOrder = await db.insert(orders).values({
            userId,
            productId,
            quantity,
            totalPrice,
        }).returning();

        res.status(201).json({
            status: 'success',
            data: {
                order: newOrder,
            },
        });
    } catch (error) {
        throw new AppError('Order creation failed', 400);
    }
};

export const getOrders = async (req: Request, res: Response) => {
    const db = getDatabase();

    try {
        const allOrders = await db.select().from(orders);
        res.status(200).json({
            status: 'success',
            data: {
                orders: allOrders,
            },
        });
    } catch (error) {
        throw new AppError('Failed to retrieve orders', 500);
    }
};