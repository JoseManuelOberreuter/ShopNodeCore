import { transbankService } from '../utils/transbankService.js';
import { orderService } from '../models/orderModel.js';
import { cartService } from '../models/cartModel.js';
import { supabase, supabaseAdmin } from '../database.js';
import logger from '../utils/logger.js';
import { requireAuth } from '../utils/authHelper.js';
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse } from '../utils/responseHelper.js';
import { validateShippingAddress } from '../utils/validators.js';

// Initiate payment process
export const initiatePayment = async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;

    const { shippingAddress } = req.body;
    
    // Validate shipping address
    logger.info('Validating shipping address:', {
      userId: req.user.id,
      hasShippingAddress: !!shippingAddress,
      shippingAddressKeys: shippingAddress ? Object.keys(shippingAddress) : []
    });
    
    const addressValidation = validateShippingAddress(shippingAddress);
    if (!addressValidation.isValid) {
      logger.warn('Shipping address validation failed:', {
        userId: req.user.id,
        error: addressValidation.error,
        missingFields: addressValidation.missingFields
      });
      return errorResponse(res, addressValidation.error, 400);
    }
    
    // Get user cart
    logger.info('Fetching user cart:', { userId: req.user.id });
    const cart = await cartService.findByUserId(req.user.id);
    if (!cart || !cart.cart_items || cart.cart_items.length === 0) {
      logger.warn('Empty cart detected:', { userId: req.user.id });
      return errorResponse(res, 'El carrito está vacío.', 400);
    }

    // Calculate total
    const totalAmount = cart.cart_items.reduce((acc, item) => 
      acc + (item.price * item.quantity), 0
    );

    logger.info('Creating order:', {
      userId: req.user.id,
      totalAmount,
      itemCount: cart.cart_items.length
    });

    // Create order
    const order = await orderService.create({
      userId: req.user.id,
      totalAmount,
      shippingAddress,
      paymentMethod: 'webpay',
      paymentStatus: 'pending'
    });

    // Create order items
    const orderItems = cart.cart_items.map(item => ({
      productId: item.product_id,
      productName: item.products?.name || '',
      quantity: item.quantity,
      price: item.price
    }));

    await orderService.createOrderItems(order.id, orderItems);

    // Create Transbank transaction
    const sessionId = `session_${req.user.id}_${Date.now()}`;
    
    // Validate that FRONTEND_URL is configured
    if (!process.env.FRONTEND_URL) {
      logger.error('FRONTEND_URL environment variable not configured');
      return serverErrorResponse(res, new Error('FRONTEND_URL no está configurado'), 'Error de configuración: FRONTEND_URL no está configurado');
    }
    
    const returnUrl = `${process.env.FRONTEND_URL}/payment/return`;
    
    logger.info('Initiating Transbank transaction:', {
      orderId: order.id,
      orderNumber: order.order_number,
      amount: totalAmount,
      sessionId,
      returnUrl: returnUrl.substring(0, 50) + '...'
    });
    
    const transbankResponse = await transbankService.createTransaction(
      totalAmount,
      order.order_number,
      sessionId,
      returnUrl
    );

    // Update order with Transbank token
    await orderService.updateTransbankToken(order.id, transbankResponse.token);

    // Clear cart
    await cartService.clearCart(cart.id);

    // Build full URL with token
    const fullTransbankUrl = `${transbankResponse.url}?token_ws=${transbankResponse.token}`;

    logger.info('Payment initiation successful:', {
      orderId: order.id,
      orderNumber: order.order_number,
      amount: totalAmount
    });

    return successResponse(res, {
      orderId: order.id,
      orderNumber: order.order_number,
      amount: totalAmount,
      transbankUrl: fullTransbankUrl,
      transbankToken: transbankResponse.token
    });

  } catch (error) {
    // Enhanced error logging with more context
    logger.error('Error initiating payment:', {
      message: error.message,
      stack: error.stack,
      userId: req.user?.id,
      hasShippingAddress: !!req.body?.shippingAddress,
      errorType: error.constructor?.name,
      transbankError: error.response?.data || error.response?.statusText,
      statusCode: error.response?.status
    });
    
    // Provide more specific error messages based on error type
    let errorMessage = 'Error al procesar el pago';
    
    if (error.message.includes('FRONTEND_URL')) {
      errorMessage = 'Error de configuración del servidor. Por favor, contacta al soporte.';
    } else if (error.message.includes('orderId') || error.message.includes('sessionId') || error.message.includes('amount')) {
      errorMessage = 'Error en los parámetros de la transacción. Por favor, intenta nuevamente.';
    } else if (error.response?.status === 500 && error.response?.data) {
      errorMessage = 'Error en el servicio de pagos. Por favor, intenta nuevamente más tarde.';
    }
    
    return serverErrorResponse(res, error, errorMessage);
  }
};

// Confirm payment (Transbank callback)
export const confirmPayment = async (req, res) => {
  try {
    const { token_ws } = req.body;

    if (!token_ws) {
      return errorResponse(res, 'Token de transacción requerido.', 400);
    }

    // Confirm transaction in Transbank
    const transbankResponse = await transbankService.confirmTransaction(token_ws);

    // Find order by token - Use supabaseAdmin to bypass RLS since this is a callback endpoint
    const { supabaseAdmin } = await import('../database.js');
    if (!supabaseAdmin) {
      logger.error('supabaseAdmin is not available - SUPABASE_SERVICE_ROLE_KEY may not be configured');
      return serverErrorResponse(res, new Error('Service role key not configured'), 'Error de configuración del servidor');
    }

    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('transbank_token', token_ws)
      .single();

    if (error || !orders) {
      logger.error('Order not found by token:', { 
        token: token_ws.substring(0, 10) + '...', 
        error: error?.message 
      });
      return notFoundResponse(res, 'Orden');
    }

    // Update order status
    const paymentStatus = transbankResponse.status === 'AUTHORIZED' ? 'paid' : 'failed';
    await orderService.updatePaymentStatus(
      orders.id, 
      paymentStatus, 
      transbankResponse.status
    );

    if (transbankResponse.status === 'AUTHORIZED') {
      await orderService.updateStatus(orders.id, 'confirmed');
    }

    // Use order amount from database, fallback to transbank response amount
    const amount = orders.total_amount || transbankResponse.amount || 0;

    return successResponse(res, {
      orderId: orders.id,
      orderNumber: orders.order_number,
      status: transbankResponse.status,
      paymentStatus,
      amount: amount,
      authorizationCode: transbankResponse.authorization_code
    });

  } catch (error) {
    logger.error('Error confirming payment:', { message: error.message });
    
    // Handle different types of errors
    if (error.message.includes('aborted')) {
      return errorResponse(res, 'El pago fue cancelado o abortado por el usuario.', 400);
    } else if (error.message.includes('Invalid status')) {
      return errorResponse(res, 'La transacción no está en un estado válido para confirmar.', 400);
    } else {
      return serverErrorResponse(res, error, 'Error al confirmar el pago');
    }
  }
};

// Get payment status
export const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await orderService.findById(orderId);
    if (!order) {
      return notFoundResponse(res, 'Orden');
    }

    const responseData = {
      orderId: order.id,
      orderNumber: order.order_number,
      paymentStatus: order.payment_status
    };

    if (order.transbank_token) {
      const transbankStatus = await transbankService.getTransactionStatus(order.transbank_token);
      responseData.transbankStatus = transbankStatus.status;
      responseData.amount = transbankStatus.amount;
    }

    return successResponse(res, responseData);

  } catch (error) {
    logger.error('Error getting payment status:', { message: error.message });
    return serverErrorResponse(res, error, 'Error al obtener el estado del pago');
  }
};

// Refund payment
export const refundPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { amount } = req.body;

    const order = await orderService.findById(orderId);
    if (!order) {
      return notFoundResponse(res, 'Orden');
    }

    if (!order.transbank_token) {
      return errorResponse(res, 'Esta orden no tiene una transacción de Transbank.', 400);
    }

    const refundAmount = amount || order.total_amount;
    const refundResponse = await transbankService.refundTransaction(
      order.transbank_token, 
      refundAmount
    );

    // Update order status
    await orderService.updatePaymentStatus(order.id, 'refunded');
    await orderService.updateStatus(order.id, 'cancelled');

    return successResponse(res, {
      orderId: order.id,
      refundAmount,
      refundResponse
    });

  } catch (error) {
    logger.error('Error refunding payment:', { message: error.message });
    return serverErrorResponse(res, error, 'Error al anular el pago');
  }
};
