import { getDatabase } from '../config/database';
import { orders, orderItems, users, products } from '../models/schema';
import { AppError } from '../middleware/errorMiddleware';
import { sql } from 'drizzle-orm';
import { ProductService } from './productService';

export interface OrderCreateDTO {
    userId: number;
    productId: number;
    quantity: number;
}

export class OrderService {
    static async createOrder(orderData: OrderCreateDTO) {
        const db = getDatabase();

        const userExists = await db.select()
            .from(users)
            .where(sql`id = ${orderData.userId}`)
            .limit(1)
            .execute();

        if (!userExists.length) {
            throw new AppError('User not found', 404);
        }

        const product = await ProductService.getProductById(orderData.productId);

        if (product.stock < orderData.quantity) {
            throw new AppError(`Insufficient stock for product ${product.name}`, 400);
        }

        const totalPrice = product.price * orderData.quantity;

        const [newOrder] = await db.insert(orders).values({
            userId: orderData.userId,
            productId: orderData.productId,
            quantity: orderData.quantity,
            totalPrice: totalPrice
        }).returning();

        const [newOrderItem] = await db.insert(orderItems).values({
            orderId: newOrder.id,
            productId: orderData.productId,
            quantity: orderData.quantity
        }).returning();

        await ProductService.updateProduct(orderData.productId, {
            stock: product.stock - orderData.quantity
        });

        return { order: newOrder, orderItem: newOrderItem };
    }

    static async getOrderById(orderId: number) {
        const db = getDatabase();

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

        const orderItemsList = await db.select()
            .from(orderItems)
            .where(sql`order_id = ${orderId}`)
            .execute();

        return {
            ...orderQuery[0].order,
            product: orderQuery[0].product,
            user: orderQuery[0].user,
            items: orderItemsList
        };
    }

    static async getOrdersByUserId(userId: number) {
        const db = getDatabase();

        const userOrders = await db.select({
            order: orders,
            product: products
        })
            .from(orders)
            .leftJoin(products, sql`${orders.productId} = ${products.id}`)
            .where(sql`${orders.userId} = ${userId}`)
            .execute();

        return userOrders;
    }

    static async updateOrder(
        orderId: number,
        updateData: Partial<OrderCreateDTO>
    ) {
        const db = getDatabase();

        // Find existing order
        const [existingOrder] = await db.select()
            .from(orders)
            .where(sql`id = ${orderId}`)
            .limit(1)
            .execute();

        if (!existingOrder) {
            throw new AppError('Order not found', 404);
        }

        const productId = updateData.productId || existingOrder.productId;
        const product = await ProductService.getProductById(productId);

        const quantity = updateData.quantity || existingOrder.quantity;
        const totalPrice = product.price * quantity;

        const [updatedOrder] = await db.update(orders)
            .set({
                productId: updateData.productId || existingOrder.productId,
                quantity: quantity,
                totalPrice: totalPrice
            })
            .where(sql`id = ${orderId}`)
            .returning();

        await db.update(orderItems)
            .set({
                productId: updateData.productId || existingOrder.productId,
                quantity: quantity
            })
            .where(sql`order_id = ${orderId}`);

        const stockDifference = quantity - existingOrder.quantity;
        await ProductService.updateProduct(productId, {
            stock: product.stock - stockDifference
        });

        return updatedOrder;
    }

    // Cancel/Delete Order
    static async cancelOrder(orderId: number) {
        const db = getDatabase();

        // Find existing order
        const [existingOrder] = await db.select()
            .from(orders)
            .where(sql`id = ${orderId}`)
            .limit(1)
            .execute();

        if (!existingOrder) {
            throw new AppError('Order not found', 404);
        }

        const product = await ProductService.getProductById(existingOrder.productId);
        await ProductService.updateProduct(existingOrder.productId, {
            stock: product.stock + existingOrder.quantity
        });

        await db.delete(orderItems)
            .where(sql`order_id = ${orderId}`);

        const [deletedOrder] = await db.delete(orders)
            .where(sql`id = ${orderId}`)
            .returning();

        return deletedOrder;
    }
}