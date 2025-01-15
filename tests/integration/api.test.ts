// tests/integration/api.test.ts
import request from 'supertest';
import { app } from '../../src/index';
import { getDatabase } from '../../src/config/database';
import { users, products, orders } from '../../src/models/schema';
import { UserRole } from '../../src/controllers/authController';

describe('E-Commerce Analytics API Integration Tests', () => {
    let adminToken: string;
    let userToken: string;
    let createdProductId: number;
    let createdOrderId: number;

    // Setup: Create test users and get tokens before running tests
    beforeAll(async () => {
        const db = getDatabase();

        // Create admin user
        const adminUser = await db.insert(users).values({
            username: 'admin_test',
            password: await bcrypt.hash('admin_password', 10),
            email: 'admin@test.com',
            role: UserRole.ADMIN
        }).returning();

        // Create regular user
        const regularUser = await db.insert(users).values({
            username: 'user_test',
            password: await bcrypt.hash('user_password', 10),
            email: 'user@test.com',
            role: UserRole.USER
        }).returning();

        // Get tokens for admin and user
        const adminLoginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'admin_test',
                password: 'admin_password'
            });

        const userLoginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'user_test',
                password: 'user_password'
            });

        adminToken = adminLoginResponse.body.data.token;
        userToken = userLoginResponse.body.data.token;
    });

    // Authentication Tests
    describe('Authentication', () => {
        it('should register a new user', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'newuser',
                    password: 'newpassword',
                    email: 'newuser@test.com'
                });

            expect(response.status).toBe(201);
            expect(response.body.status).toBe('success');
            expect(response.body.data.user).toHaveProperty('id');
            expect(response.body.data.token).toBeTruthy();
        });

        it('should login existing user', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'user_test',
                    password: 'user_password'
                });

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data.token).toBeTruthy();
        });
    });

    // Product Management Tests
    describe('Product Management', () => {
        it('should create a product (admin only)', async () => {
            const response = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Test Product',
                    description: 'A product for testing',
                    price: 100,
                    stock: 50
                });

            expect(response.status).toBe(201);
            expect(response.body.status).toBe('success');
            expect(response.body.data.product).toHaveProperty('id');

            createdProductId = response.body.data.product.id;
        });

        it('should prevent non-admin from creating product', async () => {
            const response = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    name: 'Unauthorized Product',
                    description: 'Should not be created',
                    price: 100,
                    stock: 50
                });

            expect(response.status).toBe(403);
        });

        it('should retrieve products', async () => {
            const response = await request(app)
                .get('/api/products')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(Array.isArray(response.body.data.products)).toBe(true);
        });
    });

    // Order Management Tests
    describe('Order Management', () => {
        it('should create an order', async () => {
            const response = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    productId: createdProductId,
                    quantity: 2
                });

            expect(response.status).toBe(201);
            expect(response.body.status).toBe('success');
            expect(response.body.data.order).toHaveProperty('id');

            createdOrderId = response.body.data.order.id;
        });

        it('should retrieve orders for admin', async () => {
            const response = await request(app)
                .get('/api/orders')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(Array.isArray(response.body.data.orders)).toBe(true);
        });

        it('should prevent non-admin from retrieving all orders', async () => {
            const response = await request(app)
                .get('/api/orders')
                .set('Authorization', `Bearer ${userToken}`);

            expect(response.status).toBe(403);
        });
    });

    // Analytics Endpoint Tests
    describe('Analytics Endpoints', () => {
        it('should retrieve sales report', async () => {
            const response = await request(app)
                .get('/api/analytics/sales-report')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.status).toBe('success');
            expect(response.body.data).toHaveProperty('totalSales');
            expect(response.body.data).toHaveProperty('productCount');
        });
    });

    // Error Handling Tests
    describe('Error Handling', () => {
        it('should handle invalid token', async () => {
            const response = await request(app)
                .get('/api/products')
                .set('Authorization', 'Bearer invalid_token');

            expect(response.status).toBe(401);
            expect(response.body.status).toBe('error');
        });

        it('should handle validation errors', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'a', // Too short
                    password: 'short'
                });

            expect(response.status).toBe(400);
            expect(response.body.status).toBe('error');
        });
    });

    // Cleanup after tests
    afterAll(async () => {
        const db = getDatabase();

        // Clean up test data
        await db.delete(orders).where(sql`id = ${createdOrderId}`);
        await db.delete(products).where(sql`id = ${createdProductId}`);
        await db.delete(users).where(
            sql`username IN ('admin_test', 'user_test', 'newuser')`
        );
    });
});