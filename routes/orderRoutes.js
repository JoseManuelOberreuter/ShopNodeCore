import express from 'express';
import {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  getOrderStats,
  createTestOrder
} from '../controllers/orderController.js';

// Importar middlewares
import authMiddleware from '../middlewares/authMiddleware.js';
import authAdmin from '../middlewares/authAdmin.js';

const router = express.Router();

// 🔒 RUTAS PARA USUARIOS AUTENTICADOS

// Crear nueva orden
router.post('/', authMiddleware, createOrder);

// Crear orden de prueba para desarrollo
router.post('/test', authMiddleware, createTestOrder);

// Obtener órdenes del usuario
router.get('/my-orders', authMiddleware, getUserOrders);

// Obtener orden específica por ID
router.get('/:orderId', authMiddleware, getOrderById);

// Cancelar orden
router.patch('/:orderId/cancel', authMiddleware, cancelOrder);

// 🔒 RUTAS PARA ADMINISTRADORES

// Obtener todas las órdenes (Admin)
router.get('/admin/all', authMiddleware, authAdmin, getAllOrders);

// Obtener estadísticas de órdenes (Admin)
router.get('/admin/stats', authMiddleware, authAdmin, getOrderStats);

// Actualizar estado de orden (Admin)
router.patch('/admin/:orderId/status', authMiddleware, authAdmin, updateOrderStatus);

export default router; 