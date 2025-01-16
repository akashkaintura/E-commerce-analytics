import { sql } from 'drizzle-orm';
import {
    pgTable,
    serial,
    varchar,
    integer,
    timestamp,
    pgEnum
} from 'drizzle-orm/pg-core';
import e from 'express';

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    username: varchar('username', { length: 50 }).notNull().unique(),
    password: varchar('password', { length: 255 }).notNull(),
    email: varchar('email', { length: 100 }).notNull().unique(),
    role: varchar('role', { length: 20 }).default('user'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => sql`current_timestamp`),
});

export const userRoleEnum = pgEnum('user_role', [
    'admin',
    'user',
    'manager'
]);

export const products = pgTable('products', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    description: varchar('description', { length: 500 }),
    price: integer('price').notNull(),
    stock: integer('stock').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => sql`current_timestamp`),
});

export const orders = pgTable('orders', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull(),
    productId: integer('product_id').notNull(),
    quantity: integer('quantity').notNull(),
    totalPrice: integer('total_price').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => sql`current_timestamp`),
});

export const orderItems = pgTable('order_items', {
    id: serial('id').primaryKey(),
    orderId: integer('order_id').notNull(),
    productId: integer('product_id').notNull(),
    quantity: integer('quantity').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().$onUpdateFn(() => sql`current_timestamp`),
});

export const logs = pgTable('logs', {
    id: serial('id').primaryKey(),
    message: varchar('message', { length: 255 }).notNull(),
    level: varchar('level', { length: 50 }).notNull(),
    createdAt: timestamp('created_at').defaultNow(),
});

export type UserRole = 'admin' | 'user' | 'manager';
