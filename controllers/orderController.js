import { orderService } from '../models/orderModel.js';
import { transbankService } from '../utils/transbankService.js';
import { cartService } from '../models/cartModel.js';
import { productService } from '../models/productModel.js';
import logger from '../utils/logger.js';
import { requireAuth, requireAdmin, requireOwnershipOrAdmin } from '../utils/authHelper.js';
import { successResponse, errorResponse, notFoundResponse, forbiddenResponse, serverErrorResponse } from '../utils/responseHelper.js';
import { formatOrder, formatPagination } from '../utils/formatters.js';
import { parsePaginationParams, calculatePagination } from '../utils/paginationHelper.js';
import { validateShippingAddress, validateOrderStatus, validateOrderId } from '../utils/validators.js';
import { calculateOrderStats, calculateDateRange } from '../utils/statsHelper.js';

// Create new order
export const createOrder = async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;

    const { shippingAddress, notes } = req.body;
    
    // Validate shipping address
    const addressValidation = validateShippingAddress(shippingAddress);
    if (!addressValidation.isValid) {
      return errorResponse(res, addressValidation.error, 400);
    }

    // Get user cart
    const cart = await cartService.findByUserId(req.user.id);
    if (!cart || !cart.cart_items || cart.cart_items.length === 0) {
      return errorResponse(res, 'El carrito está vacío. Agrega productos antes de crear una orden.', 400);
    }

    // Calculate total
    const totalAmount = cart.cart_items.reduce((acc, item) => 
      acc + (item.price * item.quantity), 0
    );

    // Create order
    const order = await orderService.create({
      userId: req.user.id,
      totalAmount,
      shippingAddress,
      paymentMethod: 'webpay',
      paymentStatus: 'pending',
      status: 'pending',
      notes
    });

    // Create order items
    const orderItems = cart.cart_items.map(item => ({
      productId: item.product_id,
      productName: item.products?.name || '',
      quantity: item.quantity,
      price: item.price
    }));

    await orderService.createOrderItems(order.id, orderItems);

    // Clear cart
    await cartService.clearCart(cart.id);

    const formattedOrder = formatOrder(order, false);
    return successResponse(res, formattedOrder, 'Orden creada exitosamente', 201);

  } catch (error) {
    logger.error('Error creating order:', { message: error.message });
    return serverErrorResponse(res, error, 'Error al crear la orden');
  }
};

// Get user orders
export const getUserOrders = async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;

    const { status, paymentStatus } = req.query;
    const { page, limit, offset } = parsePaginationParams(req.query);

    let orders = await orderService.findByUserId(req.user.id);

    // Filter by status if specified
    if (status) {
      orders = orders.filter(order => order.status === status);
    }

    // Filter by payment status if specified
    if (paymentStatus) {
      orders = orders.filter(order => order.payment_status === paymentStatus);
    }

    // Pagination
    const totalOrders = orders.length;
    const paginatedOrders = orders.slice(offset, offset + limit);

    // Format orders
    const formattedOrders = paginatedOrders.map(order => formatOrder(order, false));

    const pagination = calculatePagination(page, limit, totalOrders, paginatedOrders.length);

    return successResponse(res, {
      orders: formattedOrders,
      pagination
    });

  } catch (error) {
    logger.error('Error getting user orders:', { message: error.message });
    return serverErrorResponse(res, error, 'Error al obtener las órdenes');
  }
};

// Get order by ID
export const getOrderById = async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;

    const { orderId } = req.params;

    // Validate order ID
    const idValidation = validateOrderId(orderId);
    if (!idValidation.isValid) {
      return errorResponse(res, idValidation.error, 400);
    }

    const order = await orderService.findById(idValidation.orderId);
    if (!order) {
      return notFoundResponse(res, 'Orden');
    }

    // Verify that the order belongs to the user (unless admin)
    if (!requireOwnershipOrAdmin(req, res, order.user_id)) {
      return;
    }

    // Get Transbank status if token exists
    let transbankStatus = null;
    if (order.transbank_token) {
      try {
        const transbankResponse = await transbankService.getTransactionStatus(order.transbank_token);
        transbankStatus = transbankResponse.status;
      } catch (error) {
        logger.warn('No se pudo obtener estado de Transbank:', { message: error.message });
      }
    }

    const formattedOrder = formatOrder(order, true);
    if (transbankStatus) {
      formattedOrder.transbankStatus = transbankStatus;
    }

    return successResponse(res, formattedOrder);

  } catch (error) {
    logger.error('Error getting order by ID:', { message: error.message });
    return serverErrorResponse(res, error, 'Error al obtener la orden');
  }
};

// Cancel order
export const cancelOrder = async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;

    const { orderId } = req.params;
    const { reason } = req.body;

    // Validate order ID
    const idValidation = validateOrderId(orderId);
    if (!idValidation.isValid) {
      return errorResponse(res, idValidation.error, 400);
    }

    const order = await orderService.findById(idValidation.orderId);
    if (!order) {
      return notFoundResponse(res, 'Orden');
    }

    // Verify that the order belongs to the user
    if (order.user_id !== req.user.id) {
      return forbiddenResponse(res, 'No tienes permisos para cancelar esta orden.');
    }

    // Verify that the order can be cancelled
    if (order.status === 'cancelled') {
      return errorResponse(res, 'Esta orden ya está cancelada.', 400);
    }

    if (order.status === 'shipped' || order.status === 'delivered') {
      return errorResponse(res, 'No se puede cancelar una orden que ya ha sido enviada o entregada.', 400);
    }

    // If order has processed payment, try refund
    if (order.payment_status === 'paid' && order.transbank_token) {
      try {
        await transbankService.refundTransaction(order.transbank_token, order.total_amount);
        await orderService.updatePaymentStatus(order.id, 'refunded');
      } catch (error) {
        logger.error('Error processing refund:', { message: error.message });
        return serverErrorResponse(res, error, 'Error al procesar el reembolso');
      }
    }

    // Update order status
    await orderService.updateStatus(order.id, 'cancelled');

    return successResponse(res, {
      orderId: order.id,
      orderNumber: order.order_number,
      status: 'cancelled',
      refundProcessed: order.payment_status === 'paid'
    }, 'Orden cancelada exitosamente');

  } catch (error) {
    logger.error('Error cancelling order:', { message: error.message });
    return serverErrorResponse(res, error, 'Error al cancelar la orden');
  }
};

// Get all orders (Admin)
export const getAllOrders = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { status, paymentStatus, userId } = req.query;
    const { page, limit, offset } = parsePaginationParams(req.query);

    let orders = await orderService.findAll();

    // Filter by status if specified
    if (status) {
      orders = orders.filter(order => order.status === status);
    }

    // Filter by payment status if specified
    if (paymentStatus) {
      orders = orders.filter(order => order.payment_status === paymentStatus);
    }

    // Filter by user if specified
    if (userId) {
      orders = orders.filter(order => order.user_id === parseInt(userId));
    }

    // Pagination
    const totalOrders = orders.length;
    const paginatedOrders = orders.slice(offset, offset + limit);

    // Format orders
    const formattedOrders = paginatedOrders.map(order => formatOrder(order, false));

    const pagination = calculatePagination(page, limit, totalOrders, paginatedOrders.length);

    return successResponse(res, {
      orders: formattedOrders,
      pagination
    });

  } catch (error) {
    logger.error('Error getting all orders:', { message: error.message });
    return serverErrorResponse(res, error, 'Error al obtener las órdenes');
  }
};

// Update order status (Admin)
export const updateOrderStatus = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { orderId } = req.params;
    const { status, notes } = req.body;

    // Validate order ID
    const idValidation = validateOrderId(orderId);
    if (!idValidation.isValid) {
      return errorResponse(res, idValidation.error, 400);
    }

    // Validate order status
    const statusValidation = validateOrderStatus(status);
    if (!statusValidation.isValid) {
      return errorResponse(res, statusValidation.error, 400);
    }

    const order = await orderService.findById(idValidation.orderId);
    if (!order) {
      return notFoundResponse(res, 'Orden');
    }

    // Update status
    const updatedOrder = await orderService.updateStatus(idValidation.orderId, status);

    // If notes are provided, update them too
    if (notes) {
      await orderService.updateNotes(idValidation.orderId, notes);
    }

    return successResponse(res, {
      orderId: updatedOrder.id,
      orderNumber: updatedOrder.order_number,
      status: updatedOrder.status,
      updatedAt: updatedOrder.updated_at
    }, 'Estado de orden actualizado exitosamente');

  } catch (error) {
    logger.error('Error updating order status:', { message: error.message });
    return serverErrorResponse(res, error, 'Error al actualizar el estado de la orden');
  }
};

// Get order statistics (Admin)
export const getOrderStats = async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;

    const { period = '30d' } = req.query;
    
    // Calculate date range
    const { start, end } = calculateDateRange(period);

    const orders = await orderService.findAll();
    const filteredOrders = orders.filter(order => 
      new Date(order.created_at) >= start
    );

    // Calculate statistics
    const stats = calculateOrderStats(filteredOrders, period);

    return successResponse(res, {
      ...stats,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString()
      }
    });

  } catch (error) {
    logger.error('Error getting order stats:', { message: error.message });
    return serverErrorResponse(res, error, 'Error al obtener las estadísticas');
  }
};

// Create test order for development
export const createTestOrder = async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;

    // Get some products to create test order
    const products = await productService.findActive();
    if (!products || products.length === 0) {
      return errorResponse(res, 'No hay productos disponibles para crear una orden de prueba.', 400);
    }

    // Take first 2-3 products for test order
    const testProducts = products.slice(0, Math.min(3, products.length));
    const totalAmount = testProducts.reduce((sum, product) => sum + product.price, 0);

    // Create test order
    const order = await orderService.create({
      userId: req.user.id,
      totalAmount,
      shippingAddress: {
        street: 'Av. Desarrollo 123',
        city: 'Santiago',
        state: 'Metropolitana',
        zipCode: '7500000',
        country: 'Chile'
      },
      paymentMethod: 'webpay',
      paymentStatus: 'paid', // Simulate successful payment
      status: 'confirmed', // Simulate confirmed order
      notes: 'Orden de prueba creada para desarrollo'
    });

    // Create test order items
    const orderItems = testProducts.map(product => ({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      price: product.price
    }));

    await orderService.createOrderItems(order.id, orderItems);

    const formattedOrder = formatOrder(order, false);
    return successResponse(res, {
      ...formattedOrder,
      itemsCount: orderItems.length
    }, 'Orden de prueba creada exitosamente', 201);

  } catch (error) {
    logger.error('Error creating test order:', { message: error.message });
    return serverErrorResponse(res, error, 'Error al crear la orden de prueba');
  }
};
