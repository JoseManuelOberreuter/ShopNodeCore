import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartSummary,
  syncLocalCart
} from '../controllers/cartController.js';

// Importar middleware
import auth from '../middlewares/auth.js';

const router = express.Router();

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
 * /api/cart/sync:
 *   post:
 *     summary: Sincronizar carrito local con backend
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
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                     price:
 *                       type: number
 */
router.post('/sync', auth, syncLocalCart);

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

export default router; 