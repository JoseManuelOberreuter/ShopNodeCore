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

// 🔒 TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN

router.get('/', auth, getCart);

router.get('/summary', auth, getCartSummary);

router.post('/sync', auth, syncLocalCart);

router.post('/add', auth, addToCart);

router.put('/update', auth, updateCartItem);

router.delete('/remove/:productId', auth, removeFromCart);

router.delete('/clear', auth, clearCart);

export default router; 