// src/routes/orderRoutes.ts (add Swagger annotations)
import { Router } from 'express';
import { createOrder, getOrders } from '../controllers/orderController';
import { authorizeRoles } from '../controllers/authController';


/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: number
 *               productId:
 *                 type: number
 *               quantity:
 *                 type: number
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Order creation failed
 */

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Retrieve all orders
 *     tags: [Orders]
 *     responses:
 *       200:
 *         description: List of orders
 */

const router = Router();

router.post('/', authorizeRoles('user', 'admin'), createOrder);
router.get('/', getOrders);

export default router;