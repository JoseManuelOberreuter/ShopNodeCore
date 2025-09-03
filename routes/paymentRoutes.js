import express from 'express';
import { 
  initiatePayment, 
  confirmPayment, 
  getPaymentStatus, 
  refundPayment 
} from '../controllers/paymentController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación excepto confirmPayment (callback de Transbank)
router.post('/initiate', authMiddleware, initiatePayment);
router.post('/confirm', confirmPayment); // Callback de Transbank
router.get('/status/:orderId', authMiddleware, getPaymentStatus);
router.post('/refund/:orderId', authMiddleware, refundPayment);

export default router;