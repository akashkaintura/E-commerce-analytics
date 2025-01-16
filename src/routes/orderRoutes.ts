import { Router } from 'express';
import { OrderController } from '../controllers/orderController';
import { AuthController, UserRole } from '../controllers/authController';
// import { UserRoleEnum } from '../types/roles';

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management
 */

const router = Router();

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - productId
 *               - quantity
 *             properties:
 *               userId:
 *                 type: number
 *                 description: ID of the user placing the order
 *               productId:
 *                 type: number
 *                 description: ID of the product being ordered
 *               quantity:
 *                 type: number
 *                 description: Quantity of the product
 *     responses:
 *       201:
 *         description: Order created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 order:
 *                   type: object
 *                 orderItem:
 *                   type: object
 *       400:
 *         description: Order creation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
    '/',
    AuthController.verifyToken,
    // AuthController.authorizeRoles(UserRole.USER, UserRole.ADMIN),
    OrderController.createOrder
);

/**
 * @swagger
 * /api/orders/{orderId}:
 *   get:
 *     summary: Retrieve a specific order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Unique identifier of the order
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 order:
 *                   type: object
 *                 product:
 *                   type: object
 *                 user:
 *                   type: object
 *                 items:
 *                   type: array
 *       404:
 *         description: Order not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
    '/:orderId',
    AuthController.verifyToken,
    OrderController.getOrderById
);

/**
 * @swagger
 * /api/orders/user/{userId}:
 *   get:
 *     summary: Retrieve orders for a specific user
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Unique identifier of the user
 *     responses:
 *       200:
 *         description: User's orders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
    '/user/:userId',
    AuthController.verifyToken,
    OrderController.getOrdersByUserId
);

/**
 * @swagger
 * /api/orders/{orderId}:
 *   put:
 *     summary: Update an existing order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Unique identifier of the order
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: number
 *               quantity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Order updated successfully
 *       400:
 *         description: Invalid update data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */
router.put(
    '/:orderId',
    AuthController.verifyToken,
    // AuthController.authorizeRoles(UserRole.USER, UserRole.ADMIN),
    OrderController.updateOrder
);

/**
 * @swagger
 * /api/orders/{orderId}:
 *   delete:
 *     summary: Cancel an existing order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Unique identifier of the order
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Order not found
 */
router.delete(
    '/:orderId',
    // AuthController.verifyToken,
    // AuthController.authorizeRoles([UserRoleEnum.USER, UserRoleEnum.ADMIN]),
    OrderController.cancelOrder
);

export default router;