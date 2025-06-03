import express from 'express';
import {
  createOrder,
  getOrderHistory,
  getOrder
} from '../controllers/order.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { check } from 'express-validator';

const router = express.Router();

/**
 * @swagger
 * /api/v1/orders:
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
 *             $ref: '#/components/schemas/Order'
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authorized
 */
router.post(
  '/',
  [
    protect,
    [
      check('items', 'Items are required').isArray(),
      check('items.*.product', 'Product ID is required').not().isEmpty(),
      check('items.*.quantity', 'Quantity is required and must be a number').isNumeric(),
      check('shippingAddress.street', 'Street is required').not().isEmpty(),
      check('shippingAddress.city', 'City is required').not().isEmpty(),
      check('shippingAddress.state', 'State is required').not().isEmpty(),
      check('shippingAddress.zipCode', 'Zip code is required').not().isEmpty(),
      check('shippingAddress.country', 'Country is required').not().isEmpty()
    ]
  ],
  createOrder
);

/**
 * @swagger
 * /api/v1/orders:
 *   get:
 *     summary: Get order history
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *       401:
 *         description: Not authorized
 */
router.get('/', protect, getOrderHistory);

/**
 * @swagger
 * /api/v1/orders/{id}:
 *   get:
 *     summary: Get a specific order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Order not found
 */
router.get('/:id', protect, getOrder);

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       required:
 *         - items
 *         - shippingAddress
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - product
 *               - quantity
 *             properties:
 *               product:
 *                 type: string
 *                 description: Product ID
 *               quantity:
 *                 type: number
 *                 description: Quantity of the product
 *         shippingAddress:
 *           type: object
 *           required:
 *             - street
 *             - city
 *             - state
 *             - zipCode
 *             - country
 *           properties:
 *             street:
 *               type: string
 *               description: Street address
 *             city:
 *               type: string
 *               description: City
 *             state:
 *               type: string
 *               description: State/Province
 *             zipCode:
 *               type: string
 *               description: ZIP/Postal code
 *             country:
 *               type: string
 *               description: Country
 */

export default router; 