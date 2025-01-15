// tests/unit/order.test.ts
import request from 'supertest';
import { app } from '../../src/index'; // Adjust the import based on your server setup

describe('Order Controller', () => {
    it('should create a new order', async () => {
        const response = await request(app)
            .post('/api/orders')
            .send({
                userId: 1, // Assuming a user with ID 1 exists
                productId: 1, // Assuming a product with ID 1 exists
                quantity: 2,
            });

        expect(response.status).toBe(201);
        expect(response.body.status).toBe('success');
    });

    it('should retrieve all orders', async () => {
        const response = await request(app)
            .get('/api/orders');

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        expect(Array.isArray(response.body.data.orders)).toBe(true);
    });
});