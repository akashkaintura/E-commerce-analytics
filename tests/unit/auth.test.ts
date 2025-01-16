import request from 'supertest';
import { app } from '../../src/index';

describe('Auth Controller', () => {
    it('should register a new user', async () => {
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testuser',
                password: 'testpassword',
                email: 'test@example.com',
            });

        expect(response.status).toBe(201);
        expect(response.body.status).toBe('success');
    });

    it('should login an existing user', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                username: 'testuser',
                password: 'testpassword',
            });

        expect(response.status).toBe(200);
        expect(response.body.status).toBe('success');
        expect(response.body.token).toBeDefined();
    });
});