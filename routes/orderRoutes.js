import express from 'express';
import {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  getOrderStats
} from '../controllers/orderController.js';

// Importar middlewares
import auth from '../middlewares/auth.js';
import authAdmin from '../middlewares/authAdmin.js';

const router = express.Router();

// 🔒 RUTAS PARA USUARIOS AUTENTICADOS

router.post('/', auth, createOrder);

router.get('/my-orders', auth, getUserOrders);

router.get('/:orderId', auth, getOrderById);

router.patch('/:orderId/cancel', auth, cancelOrder);

// 🔒 RUTAS PARA ADMINISTRADORES

router.get('/admin/all', auth, authAdmin, getAllOrders);

router.get('/admin/stats', auth, authAdmin, getOrderStats);

router.patch('/admin/:orderId/status', auth, authAdmin, updateOrderStatus);

export default router; 