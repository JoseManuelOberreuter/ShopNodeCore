const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const mongoose = require('mongoose');

// 📌 CREAR ORDEN DESDE CARRITO
const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user.id;
    const { shippingAddress, paymentMethod = 'cash_on_delivery', notes } = req.body;

    // Validar dirección de envío
    if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
      return res.status(400).json({
        success: false,
        message: 'Dirección de envío completa es requerida'
      });
    }

    // Obtener carrito del usuario
    const cart = await Cart.findOne({ user: userId })
      .populate('items.product')
      .session(session);

    if (!cart || cart.items.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'El carrito está vacío'
      });
    }

    // Verificar stock y disponibilidad de productos
    const orderItems = [];
    let totalAmount = 0;

    for (const item of cart.items) {
      const product = await Product.findById(item.product._id).session(session);
      
      if (!product || !product.isActive) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `El producto ${item.product.name} ya no está disponible`
        });
      }

      if (product.stock < item.quantity) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para ${product.name}. Disponible: ${product.stock}, Solicitado: ${item.quantity}`
        });
      }

      // Preparar item de la orden
      const subtotal = product.price * item.quantity;
      orderItems.push({
        product: product._id,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
        subtotal: subtotal
      });

      totalAmount += subtotal;

      // Actualizar stock del producto
      await Product.findByIdAndUpdate(
        product._id,
        { $inc: { stock: -item.quantity } },
        { session }
      );
    }

    // Crear la orden
    const orderNumber = Order.generateOrderNumber();
    const order = new Order({
      user: userId,
      orderNumber,
      items: orderItems,
      totalAmount,
      shippingAddress,
      paymentMethod,
      notes: notes || ''
    });

    await order.save({ session });

    // Limpiar carrito después de crear la orden
    await Cart.findOneAndUpdate(
      { user: userId },
      { items: [], totalAmount: 0 },
      { session }
    );

    await session.commitTransaction();

    // Populate para respuesta
    await order.populate('user', 'name email');

    res.status(201).json({
      success: true,
      message: 'Orden creada exitosamente',
      data: order
    });

  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: 'Error al crear la orden',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// 📌 OBTENER ÓRDENES DEL USUARIO
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const filters = { user: userId };
    if (status) {
      filters.status = status;
    }

    const orders = await Order.find(filters)
      .populate('items.product', 'name image')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(filters);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener órdenes',
      error: error.message
    });
  }
};

// 📌 OBTENER ORDEN POR ID
const getOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      user: userId
    })
    .populate('items.product', 'name image category')
    .populate('user', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener orden',
      error: error.message
    });
  }
};

// 📌 CANCELAR ORDEN (Solo si está pendiente)
const cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      user: userId
    }).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    if (order.status !== 'pending') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden cancelar órdenes pendientes'
      });
    }

    // Restaurar stock de productos
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity } },
        { session }
      );
    }

    // Actualizar estado de la orden
    order.status = 'cancelled';
    await order.save({ session });

    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Orden cancelada exitosamente',
      data: order
    });

  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: 'Error al cancelar orden',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

// 📌 OBTENER TODAS LAS ÓRDENES (Solo Admin)
const getAllOrders = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      startDate, 
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filters = {};
    
    if (status) {
      filters.status = status;
    }

    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.$gte = new Date(startDate);
      if (endDate) filters.createdAt.$lte = new Date(endDate);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const orders = await Order.find(filters)
      .populate('user', 'name email')
      .populate('items.product', 'name image category')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(filters);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener órdenes',
      error: error.message
    });
  }
};

// 📌 ACTUALIZAR ESTADO DE ORDEN (Solo Admin)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado de orden inválido'
      });
    }

    const updateData = { status };
    if (notes) updateData.notes = notes;

    const order = await Order.findByIdAndUpdate(
      orderId,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('user', 'name email')
    .populate('items.product', 'name image');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Estado de orden actualizado exitosamente',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado de orden',
      error: error.message
    });
  }
};

// 📌 OBTENER ESTADÍSTICAS DE ÓRDENES (Solo Admin)
const getOrderStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const stats = await Order.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    const totalOrders = await Order.countDocuments(dateFilter);
    const totalRevenue = await Order.aggregate([
      { $match: { ...dateFilter, status: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        ordersByStatus: stats,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  getOrderStats
}; 