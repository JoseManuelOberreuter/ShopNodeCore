// utils/formatters.js
// Helper functions for formatting response data

/**
 * Format user data for response (excluding sensitive information)
 * @param {object} user - User object from database
 * @returns {object} - Formatted user object
 */
export const formatUser = (user) => {
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    is_verified: user.is_verified,
    avatar: user.avatar,
    telefono: user.telefono,
    fecha_nacimiento: user.fecha_nacimiento,
    direccion: user.direccion,
    created_at: user.created_at,
    updated_at: user.updated_at,
    last_login: user.last_login,
    ...(user.deleted_at && { deleted_at: user.deleted_at }),
    ...(user.is_active !== undefined && { is_active: user.is_active !== false && !user.deleted_at })
  };
};

/**
 * Format product data for response
 * @param {object} product - Product object from database
 * @returns {object} - Formatted product object
 */
export const formatProduct = (product) => {
  if (!product) return null;

  const formatted = {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    stock: product.stock,
    category: product.category,
    image: product.image,
    is_active: product.is_active,
    created_at: product.created_at,
    updated_at: product.updated_at
  };

  // Add featured and sale fields if they exist
  if (product.is_featured !== undefined) {
    formatted.is_featured = product.is_featured;
  }

  if (product.is_on_sale !== undefined) {
    formatted.is_on_sale = product.is_on_sale;
  }

  if (product.discount_percentage !== undefined && product.discount_percentage !== null) {
    formatted.discount_percentage = product.discount_percentage;
    // Calculate sale price
    formatted.sale_price = product.price * (1 - product.discount_percentage / 100);
  }

  if (product.sale_start_date) {
    formatted.sale_start_date = product.sale_start_date;
  }

  if (product.sale_end_date) {
    formatted.sale_end_date = product.sale_end_date;
  }

  return formatted;
};

/**
 * Format order data for response
 * @param {object} order - Order object from database
 * @param {boolean} includeItems - Whether to include order items
 * @returns {object} - Formatted order object
 */
export const formatOrder = (order, includeItems = true) => {
  if (!order) return null;

  const formatted = {
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
    notes: order.notes,
    createdAt: order.created_at,
    updatedAt: order.updated_at
  };

  // Include Transbank status if available
  if (order.transbank_token) {
    formatted.transbankToken = order.transbank_token;
  }

  // Include order items if requested
  if (includeItems && order.order_items) {
    formatted.items = order.order_items.map(item => ({
      id: item.id,
      productId: item.product_id,
      productName: item.product_name,
      quantity: item.quantity,
      price: item.price,
      subtotal: item.subtotal
    }));
    formatted.itemsCount = order.order_items.length;
  } else if (order.order_items) {
    formatted.itemsCount = order.order_items.length;
  }

  return formatted;
};

/**
 * Format cart data for response
 * @param {object} cart - Cart object from database
 * @returns {object} - Formatted cart object
 */
export const formatCart = (cart) => {
  if (!cart) return null;

  const items = cart.cart_items || [];
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return {
    id: cart.id,
    userId: cart.user_id,
    items: items.map(item => ({
      id: item.id,
      productId: item.product_id,
      productName: item.products?.name || '',
      price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity
    })),
    totalItems,
    totalAmount,
    itemCount: items.length,
    createdAt: cart.created_at,
    updatedAt: cart.updated_at
  };
};

/**
 * Format pagination data for response
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @param {number} items - Number of items in current page
 * @returns {object} - Formatted pagination object
 */
export const formatPagination = (page, limit, total, items) => {
  const pageInt = parseInt(page);
  const limitInt = parseInt(limit);
  const totalPages = Math.ceil(total / limitInt);

  return {
    currentPage: pageInt,
    totalPages,
    totalItems: total,
    itemsPerPage: limitInt,
    itemsInCurrentPage: items,
    hasNextPage: pageInt < totalPages,
    hasPreviousPage: pageInt > 1
  };
};

