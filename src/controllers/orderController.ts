import { Request, Response } from 'express';
import { AppError } from '../middleware/errorMiddleware';
import { getDatabase } from '../config/database';
import { orders, products, users } from '../models/schema';
import { sql } from 'drizzle-orm';
import { ProductService } from '../services/productService';

export class OrderController {
    static async createOrder(req: Request, res: Response) {
        const { userId, productId, quantity } = req.body;

        const db = getDatabase();

        try {
            const product = await ProductService.getProductById(productId);

            if (product.stock < quantity) {
                throw new AppError(`Insufficient stock for product ${product.name}`, 400);
            }

            const totalPrice = product.price * quantity;

            const [newOrder] = await db.insert(orders).values({
                userId,
                productId,
                quantity,
                totalPrice,
            }).returning();

            await ProductService.updateProduct(productId, {
                stock: product.stock - quantity
            });

            res.status(201).json({
                status: 'success',
                data: {
                    order: newOrder,
                },
            });
        } catch (error: any) {
            throw new AppError(
                error.message || 'Order creation failed',
                error.statusCode || 400
            );
        }
    }

    static async getOrderById(req: Request, res: Response) {
        const { orderId } = req.params;
        const db = getDatabase();

        try {
            const orderQuery = await db.select({
                order: orders,
                product: products,
                user: users
            })
                .from(orders)
                .leftJoin(products, sql`${orders.productId} = ${products.id}`)
                .leftJoin(users, sql`${orders.userId} = ${users.id}`)
                .where(sql`${orders.id} = ${orderId}`)
                .limit(1)
                .execute();

            if (!orderQuery.length) {
                throw new AppError('Order not found', 404);
            }

            res.status(200).json({
                status: 'success',
                data: {
                    order: orderQuery[0].order,
                    product: orderQuery[0].product,
                    user: orderQuery[0].user,
                },
            });
        } catch (error: any) {
            throw new AppError(
                error.message || 'Failed to retrieve order',
                error.statusCode || 500
            );
        }
    }
    static async getOrdersByUserId(req: Request, res: Response) {
        const { userId } = req.params;
        const db = getDatabase();

        try {
            const userOrders = await db.select({
                order: orders,
                product: products
            })
                .from(orders)
                .leftJoin(products, sql`${orders.productId} = ${products.id}`)
                .where(sql`${orders.userId} = ${userId}`)
                .execute();

            res.status(200).json({
                status: 'success',
                data: {
                    orders: userOrders,
                },
            });
        } catch (error) {
            const err = error as { message?: string; statusCode?: number };
            throw new AppError(
                err.message || 'Failed to retrieve order',
                err.statusCode || 500
            );
        }
    }

    static async updateOrder(req: Request, res: Response) {
        const { orderId } = req.params;
        const { productId, quantity } = req.body;
        const db = getDatabase();

        try {
            const [existingOrder] = await db.select()
                .from(orders)
                .where(sql`id = ${orderId}`)
                .limit(1)
                .execute();

            if (!existingOrder) {
                throw new AppError('Order not found', 404);
            }

            const product = await ProductService.getProductById(
                productId || existingOrder.productId
            );

            const newQuantity = quantity || existingOrder.quantity;
            const totalPrice = product.price * newQuantity;

            const [updatedOrder] = await db.update(orders)
                .set({
                    productId: productId || existingOrder.productId,
                    quantity: newQuantity,
                    totalPrice: totalPrice
                })
                .where(sql`id = ${orderId}`)
                .returning();

            const stockDifference = newQuantity - existingOrder.quantity;
            await ProductService.updateProduct(product.id, {
                stock: product.stock - stockDifference
            });

            res.status(200).json({
                status: 'success',
                data: {
                    order: updatedOrder,
                },
            });
        } catch (error) {
            const err = error as { message?: string; statusCode?: number };
            throw new AppError(
                err.message || 'Failed to update order',
                err.statusCode || 400
            );
        }
    }

    static async cancelOrder(req: Request, res: Response) {
        const { orderId } = req.params;
        const db = getDatabase();

        try {
            const [existingOrder] = await db.select()
                .from(orders)
                .where(sql`id = ${orderId}`)
                .limit(1)
                .execute();

            if (!existingOrder) {
                throw new AppError('Order not found', 404);
            }

            const product = await ProductService.getProductById(existingOrder.productId);
            await ProductService.updateProduct(product.id, {
                stock: product.stock + existingOrder.quantity
            });

            const [deletedOrder] = await db.delete(orders)
                .where(sql`id = ${orderId}`)
                .returning();

            res.status(200).json({
                status: 'success',
                data: {
                    order: deletedOrder,
                },
            });
        } catch (error) {
            const err = error as { message?: string; statusCode?: number };
            throw new AppError(
                err.message || 'Failed to cancel order',
                err.statusCode || 400
            );
        }
    }
}

export const {
    createOrder,
    getOrderById: getOrders
} = OrderController;