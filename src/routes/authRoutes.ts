import express, { Request, Response, NextFunction } from 'express';
import { registerUser, loginUser, AuthController } from '../controllers/authController';

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication management
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation failed
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login an existing user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       401:
 *         description: Invalid credentials
 */

const router = express.Router();

router.use((req, res, next) => {
    console.log(`Auth Route Hit: ${req.method} ${req.path}`);
    console.log('Request Body:', req.body);
    next();
});

router.post('/refresh-token', AuthController.refreshToken);
// router.post('/register', registerUser);
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('Register Route Accessed');
        console.log('Request Body:', req.body);

        // Directly use the AuthController method
        await AuthController.registerUser(req, res);
    } catch (error) {
        console.error('Registration Error:', error);
        next(error);
    }
});
router.post('/login', AuthController.loginUser);

//route for the swagger documentation
// router.get('/api-docs', AuthController.swaggerDocs);

export default router;