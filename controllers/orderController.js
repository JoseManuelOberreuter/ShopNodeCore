import { orderService } from '../models/orderModel.js';
import { transbankService } from '../utils/transbankService.js';
import { cartService } from '../models/cartModel.js';
import { productService } from '../models/productModel.js';
import logger from '../utils/logger.js';

// Crear nueva orden
export const createOrder = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Debes iniciar sesión para crear una orden.'
      });
    }

    const { shippingAddress, notes } = req.body;
    
    // Validar dirección de envío
    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || 
        !shippingAddress.state || !shippingAddress.zipCode || !shippingAddress.country) {
      return res.status(400).json({
        success: false,
        message: 'La dirección de envío es requerida con todos los campos.'
      });
    }

    // Obtener carrito del usuario
    const cart = await cartService.findByUserId(req.user.id);
    if (!cart || !cart.cart_items || cart.cart_items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El carrito está vacío. Agrega productos antes de crear una orden.'
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
      paymentStatus: 'pending',
      status: 'pending',
      notes
    });

    // Crear items de orden
    const orderItems = cart.cart_items.map(item => ({
      productId: item.product_id,
      productName: item.products?.name || '',
      quantity: item.quantity,
      price: item.price
    }));

    await orderService.createOrderItems(order.id, orderItems);

    // Limpiar carrito
    await cartService.clearCart(cart.id);

    return res.status(201).json({
      success: true,
      message: 'Orden creada exitosamente',
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        totalAmount: order.total_amount,
        status: order.status,
        paymentStatus: order.payment_status,
        shippingAddress: order.shipping_street + ', ' + order.shipping_city + ', ' + order.shipping_state,
        createdAt: order.created_at
      }
    });

  } catch (error) {
    logger.error('Error creating order:', { message: error.message });
    return res.status(500).json({
      success: false,
      message: 'Error al crear la orden: ' + error.message
    });
  }
};

// Obtener órdenes del usuario
export const getUserOrders = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Debes iniciar sesión para ver tus órdenes.'
      });
    }

    const { page = 1, limit = 10, status, paymentStatus } = req.query;
    const offset = (page - 1) * limit;

    let orders = await orderService.findByUserId(req.user.id);

    // Filtrar por estado si se especifica
    if (status) {
      orders = orders.filter(order => order.status === status);
    }

    // Filtrar por estado de pago si se especifica
    if (paymentStatus) {
      orders = orders.filter(order => order.payment_status === paymentStatus);
    }

    // Paginación
    const totalOrders = orders.length;
    const paginatedOrders = orders.slice(offset, offset + parseInt(limit));

    // Formatear respuesta
    const formattedOrders = paginatedOrders.map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      totalAmount: order.total_amount,
      status: order.status,
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method,
      shippingAddress: {
        street: order.shipping_street,
        city: order.shipping_city,
        state: order.shipping_state,
        zipCode: order.shipping_zip_code,
        country: order.shipping_country
      },
      itemsCount: order.order_items?.length || 0,
      createdAt: order.created_at,
      updatedAt: order.updated_at
    }));

    return res.json({
      success: true,
      data: {
        orders: formattedOrders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalOrders / limit),
          totalOrders,
          hasNextPage: offset + parseInt(limit) < totalOrders,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    logger.error('Error getting user orders:', { message: error.message });
    return res.status(500).json({
      success: false,
      message: 'Error al obtener las órdenes: ' + error.message
    });
  }
};

// Obtener orden por ID
export const getOrderById = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Debes iniciar sesión para ver los detalles de la orden.'
      });
    }

    const { orderId } = req.params;

    const order = await orderService.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada.'
      });
    }

    // Verificar que la orden pertenece al usuario (a menos que sea admin)
    if (order.user_id !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver esta orden.'
      });
    }

    // Obtener estado de Transbank si existe token
    let transbankStatus = null;
    if (order.transbank_token) {
      try {
        const transbankResponse = await transbankService.getTransactionStatus(order.transbank_token);
        transbankStatus = transbankResponse.status;
      } catch (error) {
        logger.warn('No se pudo obtener estado de Transbank:', { message: error.message });
      }
    }

    const formattedOrder = {
      id: order.id,
      orderNumber: order.order_number,
      totalAmount: order.total_amount,
      status: order.status,
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method,
      transbankStatus,
      shippingAddress: {
        street: order.shipping_street,
        city: order.shipping_city,
        state: order.shipping_state,
        zipCode: order.shipping_zip_code,
        country: order.shipping_country
      },
      items: order.order_items?.map(item => ({
        id: item.id,
        productId: item.product_id,
        productName: item.product_name,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal
      })) || [],
      notes: order.notes,
      createdAt: order.created_at,
      updatedAt: order.updated_at
    };

    return res.json({
      success: true,
      data: formattedOrder
    });

  } catch (error) {
    logger.error('Error getting order by ID:', { message: error.message });
    return res.status(500).json({
      success: false,
      message: 'Error al obtener la orden: ' + error.message
    });
  }
};

// Cancelar orden
export const cancelOrder = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Debes iniciar sesión para cancelar una orden.'
      });
    }

    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await orderService.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada.'
      });
    }

    // Verificar que la orden pertenece al usuario
    if (order.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para cancelar esta orden.'
      });
    }

    // Verificar que la orden se puede cancelar
    if (order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Esta orden ya está cancelada.'
      });
    }

    if (order.status === 'shipped' || order.status === 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'No se puede cancelar una orden que ya ha sido enviada o entregada.'
      });
    }

    // Si la orden tiene pago procesado, intentar reembolso
    if (order.payment_status === 'paid' && order.transbank_token) {
      try {
        await transbankService.refundTransaction(order.transbank_token, order.total_amount);
        await orderService.updatePaymentStatus(order.id, 'refunded');
      } catch (error) {
        logger.error('Error processing refund:', { message: error.message });
        return res.status(500).json({
          success: false,
          message: 'Error al procesar el reembolso: ' + error.message
        });
      }
    }

    // Actualizar estado de la orden
    await orderService.updateStatus(order.id, 'cancelled');

    return res.json({
      success: true,
      message: 'Orden cancelada exitosamente',
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        status: 'cancelled',
        refundProcessed: order.payment_status === 'paid'
      }
    });

  } catch (error) {
    logger.error('Error cancelling order:', { message: error.message });
    return res.status(500).json({
      success: false,
      message: 'Error al cancelar la orden: ' + error.message
    });
  }
};

// Obtener todas las órdenes (Admin)
export const getAllOrders = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a esta información.'
      });
    }

    const { page = 1, limit = 20, status, paymentStatus, userId } = req.query;
    const offset = (page - 1) * limit;

    let orders = await orderService.findAll();

    // Filtrar por estado si se especifica
    if (status) {
      orders = orders.filter(order => order.status === status);
    }

    // Filtrar por estado de pago si se especifica
    if (paymentStatus) {
      orders = orders.filter(order => order.payment_status === paymentStatus);
    }

    // Filtrar por usuario si se especifica
    if (userId) {
      orders = orders.filter(order => order.user_id === userId);
    }

    // Paginación
    const totalOrders = orders.length;
    const paginatedOrders = orders.slice(offset, offset + parseInt(limit));

    // Formatear respuesta
    const formattedOrders = paginatedOrders.map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      userId: order.user_id,
      totalAmount: order.total_amount,
      status: order.status,
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method,
      shippingAddress: {
        street: order.shipping_street,
        city: order.shipping_city,
        state: order.shipping_state,
        zipCode: order.shipping_zip_code,
        country: order.shipping_country
      },
      itemsCount: order.order_items?.length || 0,
      createdAt: order.created_at,
      updatedAt: order.updated_at
    }));

    return res.json({
      success: true,
      data: {
        orders: formattedOrders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalOrders / limit),
          totalOrders,
          hasNextPage: offset + parseInt(limit) < totalOrders,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    logger.error('Error getting all orders:', { message: error.message });
    return res.status(500).json({
      success: false,
      message: 'Error al obtener las órdenes: ' + error.message
    });
  }
};

// Actualizar estado de orden (Admin)
export const updateOrderStatus = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para actualizar el estado de las órdenes.'
      });
    }

    const { orderId } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido. Estados válidos: ' + validStatuses.join(', ')
      });
    }

    const order = await orderService.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada.'
      });
    }

    // Actualizar estado
    const updatedOrder = await orderService.updateStatus(orderId, status);

    // Si se agregan notas, actualizarlas también
    if (notes) {
      await orderService.updateNotes(orderId, notes);
    }

    return res.json({
      success: true,
      message: 'Estado de orden actualizado exitosamente',
      data: {
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.order_number,
        status: updatedOrder.status,
        updatedAt: updatedOrder.updated_at
      }
    });

  } catch (error) {
    logger.error('Error updating order status:', { message: error.message });
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado de la orden: ' + error.message
    });
  }
};

// Obtener estadísticas de órdenes (Admin)
export const getOrderStats = async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a esta información.'
      });
    }

    const { period = '30d' } = req.query;
    
    // Calcular fecha de inicio según el período
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const orders = await orderService.findAll();
    const filteredOrders = orders.filter(order => 
      new Date(order.created_at) >= startDate
    );

    // Calcular estadísticas
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders
      .filter(order => order.payment_status === 'paid')
      .reduce((sum, order) => sum + order.total_amount, 0);
    
    const ordersByStatus = filteredOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    const ordersByPaymentStatus = filteredOrders.reduce((acc, order) => {
      acc[order.payment_status] = (acc[order.payment_status] || 0) + 1;
      return acc;
    }, {});

    // Calcular promedio de orden
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Calcular conversión de pago
    const paidOrders = ordersByPaymentStatus.paid || 0;
    const conversionRate = totalOrders > 0 ? (paidOrders / totalOrders) * 100 : 0;

    return res.json({
      success: true,
      data: {
        period,
        summary: {
          totalOrders,
          totalRevenue,
          averageOrderValue,
          conversionRate: Math.round(conversionRate * 100) / 100
        },
        ordersByStatus,
        ordersByPaymentStatus,
        dateRange: {
          start: startDate.toISOString(),
          end: now.toISOString()
        }
      }
    });

  } catch (error) {
    logger.error('Error getting order stats:', { message: error.message });
    return res.status(500).json({
      success: false,
      message: 'Error al obtener las estadísticas: ' + error.message
    });
  }
};

// Crear orden de prueba para desarrollo
export const createTestOrder = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Debes iniciar sesión para crear una orden de prueba.'
      });
    }

    // Obtener algunos productos para crear la orden de prueba
    const products = await productService.findActive();
    if (!products || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay productos disponibles para crear una orden de prueba.'
      });
    }

    // Tomar los primeros 2-3 productos para la orden de prueba
    const testProducts = products.slice(0, Math.min(3, products.length));
    const totalAmount = testProducts.reduce((sum, product) => sum + product.price, 0);

    // Crear orden de prueba
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
      paymentStatus: 'paid', // Simular pago exitoso
      status: 'confirmed', // Simular orden confirmada
      notes: 'Orden de prueba creada para desarrollo'
    });

    // Crear items de orden de prueba
    const orderItems = testProducts.map(product => ({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      price: product.price
    }));

    await orderService.createOrderItems(order.id, orderItems);

    return res.status(201).json({
      success: true,
      message: 'Orden de prueba creada exitosamente',
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        totalAmount: order.total_amount,
        status: order.status,
        paymentStatus: order.payment_status,
        itemsCount: orderItems.length,
        createdAt: order.created_at
      }
    });

  } catch (error) {
    logger.error('Error creating test order:', { message: error.message });
    return res.status(500).json({
      success: false,
      message: 'Error al crear la orden de prueba: ' + error.message
    });
  }
}; 