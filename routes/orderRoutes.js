const express = require('express');
const router = express.Router();
const {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  getOrderStats
} = require('../controllers/orderController');

// Importar middlewares
const auth = require('../middlewares/auth');
const authAdmin = require('../middlewares/authAdmin');

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Gestión de órdenes de compra
 */

// 🔒 RUTAS PARA USUARIOS AUTENTICADOS

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Crear nueva orden desde carrito
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
 *               - shippingAddress
 *             properties:
 *               shippingAddress:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   zipCode:
 *                     type: string
 *                   country:
 *                     type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [credit_card, debit_card, paypal, cash_on_delivery]
 *               notes:
 *                 type: string
 */
router.post('/', auth, createOrder);

/**
 * @swagger
 * /api/orders/my-orders:
 *   get:
 *     summary: Obtener órdenes del usuario
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 */
router.get('/my-orders', auth, getUserOrders);

/**
 * @swagger
 * /api/orders/{orderId}:
 *   get:
 *     summary: Obtener orden por ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:orderId', auth, getOrderById);

/**
 * @swagger
 * /api/orders/{orderId}/cancel:
 *   patch:
 *     summary: Cancelar orden
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 */
router.patch('/:orderId/cancel', auth, cancelOrder);

// 🔒 RUTAS PARA ADMINISTRADORES

/**
 * @swagger
 * /api/orders/admin/all:
 *   get:
 *     summary: Obtener todas las órdenes (Solo Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 */
router.get('/admin/all', auth, authAdmin, getAllOrders);

/**
 * @swagger
 * /api/orders/admin/stats:
 *   get:
 *     summary: Obtener estadísticas de órdenes (Solo Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 */
router.get('/admin/stats', auth, authAdmin, getOrderStats);

/**
 * @swagger
 * /api/orders/admin/{orderId}/status:
 *   patch:
 *     summary: Actualizar estado de orden (Solo Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, processing, shipped, delivered, cancelled]
 *               notes:
 *                 type: string
 */
router.patch('/admin/:orderId/status', auth, authAdmin, updateOrderStatus);

module.exports = router; 