const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartSummary
} = require('../controllers/cartController');

// Importar middleware
const auth = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Gestión del carrito de compras
 */

// 🔒 TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Obtener carrito del usuario
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Carrito obtenido exitosamente
 */
router.get('/', auth, getCart);

/**
 * @swagger
 * /api/cart/summary:
 *   get:
 *     summary: Obtener resumen del carrito
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 */
router.get('/summary', auth, getCartSummary);

/**
 * @swagger
 * /api/cart/add:
 *   post:
 *     summary: Agregar producto al carrito
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 default: 1
 */
router.post('/add', auth, addToCart);

/**
 * @swagger
 * /api/cart/update:
 *   put:
 *     summary: Actualizar cantidad de producto en carrito
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *               quantity:
 *                 type: integer
 */
router.put('/update', auth, updateCartItem);

/**
 * @swagger
 * /api/cart/remove/{productId}:
 *   delete:
 *     summary: Eliminar producto del carrito
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 */
router.delete('/remove/:productId', auth, removeFromCart);

/**
 * @swagger
 * /api/cart/clear:
 *   delete:
 *     summary: Limpiar carrito completo
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/clear', auth, clearCart);

module.exports = router; 