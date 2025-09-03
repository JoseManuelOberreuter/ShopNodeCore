import { transbankService } from '../utils/transbankService.js';
import { orderService } from '../models/orderModel.js';
import { cartService } from '../models/cartModel.js';
import { supabase } from '../database.js';

// Función auxiliar para verificar autenticación
function requireAuth(req, res) {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Debes iniciar sesión para procesar el pago.'
    });
    return false;
  }
  return true;
}

// Iniciar proceso de pago
export const initiatePayment = async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;

    const { shippingAddress } = req.body;
    
    // Obtener carrito del usuario
    const cart = await cartService.findByUserId(req.user.id);
    if (!cart || !cart.cart_items || cart.cart_items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El carrito está vacío.'
      });
    }

    // Calcular total
    const totalAmount = cart.cart_items.reduce((acc, item) => 
      acc + (item.price * item.quantity), 0
    );

    // Crear orden
    const order = await orderService.create({
      userId: req.user.id,
      totalAmount,
      shippingAddress,
      paymentMethod: 'webpay',
      paymentStatus: 'pending'
    });

    // Crear items de orden
    const orderItems = cart.cart_items.map(item => ({
      productId: item.product_id,
      productName: item.products?.name || '',
      quantity: item.quantity,
      price: item.price
    }));

    await orderService.createOrderItems(order.id, orderItems);

    // Crear transacción en Transbank
    const sessionId = `session_${req.user.id}_${Date.now()}`;
    const returnUrl = `${process.env.FRONTEND_URL}/payment/return`;
    
    const transbankResponse = await transbankService.createTransaction(
      totalAmount,
      order.order_number,
      sessionId,
      returnUrl
    );

    // Actualizar orden con token de Transbank
    await orderService.updateTransbankToken(order.id, transbankResponse.token);

    // Limpiar carrito
    await cartService.clearCart(cart.id);

    // Construir la URL completa con el token
    const fullTransbankUrl = `${transbankResponse.url}?token_ws=${transbankResponse.token}`;

    return res.json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        amount: totalAmount,
        transbankUrl: fullTransbankUrl,
        transbankToken: transbankResponse.token
      }
    });

  } catch (error) {
    console.error('Error initiating payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al procesar el pago: ' + error.message
    });
  }
};

// Confirmar pago (callback de Transbank)
export const confirmPayment = async (req, res) => {
  try {
    const { token_ws } = req.body;

    if (!token_ws) {
      return res.status(400).json({
        success: false,
        message: 'Token de transacción requerido.'
      });
    }

    // Confirmar transacción en Transbank
    console.log('🔍 Intentando confirmar transacción con token:', token_ws);
    const transbankResponse = await transbankService.confirmTransaction(token_ws);
    console.log('✅ Respuesta de confirmación:', transbankResponse);

    // Buscar orden por token
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('transbank_token', token_ws)
      .single();

    if (error || !orders) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada.'
      });
    }

    // Actualizar estado de la orden
    const paymentStatus = transbankResponse.status === 'AUTHORIZED' ? 'paid' : 'failed';
    await orderService.updatePaymentStatus(
      orders.id, 
      paymentStatus, 
      transbankResponse.status
    );

    if (transbankResponse.status === 'AUTHORIZED') {
      await orderService.updateStatus(orders.id, 'confirmed');
    }

    return res.json({
      success: true,
      data: {
        orderId: orders.id,
        orderNumber: orders.order_number,
        status: transbankResponse.status,
        paymentStatus,
        amount: transbankResponse.amount,
        authorizationCode: transbankResponse.authorization_code
      }
    });

  } catch (error) {
    console.error('Error confirming payment:', error);
    
    // Manejar diferentes tipos de errores
    if (error.message.includes('aborted')) {
      return res.status(400).json({
        success: false,
        message: 'El pago fue cancelado o abortado por el usuario.',
        errorType: 'payment_aborted'
      });
    } else if (error.message.includes('Invalid status')) {
      return res.status(400).json({
        success: false,
        message: 'La transacción no está en un estado válido para confirmar.',
        errorType: 'invalid_transaction_status'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Error al confirmar el pago: ' + error.message,
        errorType: 'confirmation_error'
      });
    }
  }
};

// Obtener estado de pago
export const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await orderService.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada.'
      });
    }

    if (order.transbank_token) {
      const transbankStatus = await transbankService.getTransactionStatus(order.transbank_token);
      
      return res.json({
        success: true,
        data: {
          orderId: order.id,
          orderNumber: order.order_number,
          paymentStatus: order.payment_status,
          transbankStatus: transbankStatus.status,
          amount: transbankStatus.amount
        }
      });
    }

    return res.json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        paymentStatus: order.payment_status
      }
    });

  } catch (error) {
    console.error('Error getting payment status:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener el estado del pago: ' + error.message
    });
  }
};

// Anular pago
export const refundPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { amount } = req.body;

    const order = await orderService.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada.'
      });
    }

    if (!order.transbank_token) {
      return res.status(400).json({
        success: false,
        message: 'Esta orden no tiene una transacción de Transbank.'
      });
    }

    const refundAmount = amount || order.total_amount;
    const refundResponse = await transbankService.refundTransaction(
      order.transbank_token, 
      refundAmount
    );

    // Actualizar estado de la orden
    await orderService.updatePaymentStatus(order.id, 'refunded');
    await orderService.updateStatus(order.id, 'cancelled');

    return res.json({
      success: true,
      data: {
        orderId: order.id,
        refundAmount,
        refundResponse
      }
    });

  } catch (error) {
    console.error('Error refunding payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al anular el pago: ' + error.message
    });
  }
};