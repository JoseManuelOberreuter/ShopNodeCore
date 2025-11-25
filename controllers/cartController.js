import { cartService } from '../models/cartModel.js';
import logger from '../utils/logger.js';
import { validateProductForCart, validateCartItemData, validateProductExists, validateProductId } from '../utils/validators.js';
import { requireAuth } from '../utils/authHelper.js';
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse } from '../utils/responseHelper.js';
import { formatCart } from '../utils/formatters.js';
import { calculateProductPrice } from '../utils/productPriceHelper.js';

// Helper function to get or create cart
async function getOrCreateCart(userId) {
  let cart = await cartService.findByUserId(userId);
  if (!cart) {
    cart = await cartService.create(userId);
  }
  return cart;
}

// Helper function to clean inactive products from cart
async function cleanInactiveProducts(cart) {
  if (!cart || !cart.cart_items || !Array.isArray(cart.cart_items)) {
    return [];
  }

  const removedProductIds = [];
  
  for (const item of cart.cart_items) {
    // Check if product is inactive or null/undefined
    const product = item.products;
    if (!product || product.is_active === false) {
      try {
        await cartService.removeItem(cart.id, item.product_id);
        removedProductIds.push(item.product_id);
        
        logger.info('Producto inactivo eliminado del carrito', {
          cartId: cart.id,
          productId: item.product_id,
          productName: product?.name || 'Desconocido'
        });
      } catch (error) {
        logger.error('Error eliminando producto inactivo del carrito', {
          cartId: cart.id,
          productId: item.product_id,
          error: error.message
        });
      }
    }
  }
  
  return removedProductIds;
}

export const getCart = async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;
    
    let cart = await getOrCreateCart(req.user.id);
    
    // Clean inactive products before returning
    const removedProductIds = await cleanInactiveProducts(cart);
    
    // If products were removed, get the updated cart
    if (removedProductIds.length > 0) {
      cart = await cartService.findByUserId(req.user.id);
      logger.info('Productos inactivos eliminados del carrito', {
        userId: req.user.id,
        removedCount: removedProductIds.length,
        removedProductIds
      });
    }
    
    const formattedCart = formatCart(cart);
    
    // Add information about removed products to response
    const responseData = {
      ...formattedCart,
      removedProducts: removedProductIds.length > 0 ? {
        count: removedProductIds.length,
        productIds: removedProductIds
      } : undefined
    };
    
    return successResponse(res, responseData);
  } catch (error) {
    logger.error('Error obteniendo carrito:', { message: error.message, userId: req.user?.id });
    return serverErrorResponse(res, error);
  }
};

export const addToCart = async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;
    
    const { productId, quantity = 1 } = req.body;

    // Validate basic data
    const dataValidation = validateCartItemData({ productId, quantity });
    if (!dataValidation.isValid) {
      return errorResponse(res, dataValidation.error, 400);
    }

    // Get or create cart before validation (needed to check quantity in cart)
    const cart = await getOrCreateCart(req.user.id);

    // Validate product and stock (considering quantity already in cart)
    const productValidation = await validateProductForCart(productId, quantity, cart);
    if (!productValidation.isValid) {
      const statusCode = productValidation.error.includes('no encontrado') ? 404 : 400;
      return errorResponse(res, productValidation.error, statusCode);
    }

    // Calculate final price considering current offers
    const finalPrice = calculateProductPrice(productValidation.product);

    // Add item to cart with calculated price
    await cartService.addItem(cart.id, productId, quantity, finalPrice);
    
    // Get updated cart
    const updatedCart = await cartService.findByUserId(req.user.id);
    const formattedCart = formatCart(updatedCart);
    
    logger.info('Producto agregado al carrito', {
      userId: req.user.id,
      productId,
      quantity
    });

    return successResponse(res, formattedCart, 'Producto agregado al carrito exitosamente');
  } catch (error) {
    logger.error('Error agregando producto al carrito:', {
      message: error.message,
      userId: req.user?.id,
      productId: req.body?.productId
    });
    return serverErrorResponse(res, error);
  }
};

export const updateCartItem = async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;
    
    const { productId, quantity } = req.body;

    // Validate basic data
    const dataValidation = validateCartItemData({ productId, quantity });
    if (!dataValidation.isValid) {
      return errorResponse(res, dataValidation.error, 400);
    }

    // Get cart
    const cart = await cartService.findByUserId(req.user.id);
    if (!cart) {
      return notFoundResponse(res, 'Carrito');
    }

    // Validate product and stock (considering quantity already in cart)
    const productValidation = await validateProductForCart(productId, quantity, cart);
    if (!productValidation.isValid) {
      const statusCode = productValidation.error.includes('no encontrado') ? 404 : 400;
      return errorResponse(res, productValidation.error, statusCode);
    }

    // Calculate final price considering current offers (price may have changed)
    const finalPrice = calculateProductPrice(productValidation.product);

    // Update item quantity and price (in case offer status changed)
    await cartService.updateItemQuantityAndPrice(cart.id, productId, quantity, finalPrice);
    
    // Get updated cart
    const updatedCart = await cartService.findByUserId(req.user.id);
    const formattedCart = formatCart(updatedCart);
    
    logger.info('Item del carrito actualizado', {
      userId: req.user.id,
      productId,
      quantity
    });

    return successResponse(res, formattedCart, 'Carrito actualizado exitosamente');
  } catch (error) {
    logger.error('Error actualizando item del carrito:', {
      message: error.message,
      userId: req.user?.id,
      productId: req.body?.productId
    });
    return serverErrorResponse(res, error);
  }
};

export const removeFromCart = async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;
    
    const { productId } = req.params;
    
    // Validate product ID
    const idValidation = validateProductId(productId);
    if (!idValidation.isValid) {
      return errorResponse(res, idValidation.error, 400);
    }

    // Get cart
    const cart = await cartService.findByUserId(req.user.id);
    if (!cart) {
      return notFoundResponse(res, 'Carrito');
    }

    // Validate that product exists (only for logging)
    const productValidation = await validateProductExists(productId);
    if (!productValidation.isValid && !productValidation.error.includes('no encontrado')) {
      // If product is not active, we still remove it from cart
      logger.warn('Eliminando producto inactivo del carrito', {
        userId: req.user.id,
        productId
      });
    }

    // Remove item from cart
    await cartService.removeItem(cart.id, productId);
    
    // Get updated cart
    const updatedCart = await cartService.findByUserId(req.user.id);
    const formattedCart = formatCart(updatedCart);
    
    logger.info('Producto eliminado del carrito', {
      userId: req.user.id,
      productId
    });

    return successResponse(res, formattedCart, 'Producto eliminado del carrito exitosamente');
  } catch (error) {
    logger.error('Error eliminando producto del carrito:', {
      message: error.message,
      userId: req.user?.id,
      productId: req.params?.productId
    });
    return serverErrorResponse(res, error);
  }
};

export const clearCart = async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;
    
    const cart = await cartService.findByUserId(req.user.id);
    if (!cart) {
      return notFoundResponse(res, 'Carrito');
    }

    await cartService.clearCart(cart.id);
    
    // Get updated cart
    const updatedCart = await cartService.findByUserId(req.user.id);
    const formattedCart = formatCart(updatedCart);
    
    logger.info('Carrito limpiado', { userId: req.user.id });

    return successResponse(res, formattedCart, 'Carrito limpiado exitosamente');
  } catch (error) {
    logger.error('Error limpiando carrito:', {
      message: error.message,
      userId: req.user?.id
    });
    return serverErrorResponse(res, error);
  }
};

export const getCartSummary = async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;
    
    let cart = await getOrCreateCart(req.user.id);
    
    // Clean inactive products before returning
    const removedProductIds = await cleanInactiveProducts(cart);
    
    // If products were removed, get the updated cart
    if (removedProductIds.length > 0) {
      cart = await cartService.findByUserId(req.user.id);
      logger.info('Productos inactivos eliminados del carrito (summary)', {
        userId: req.user.id,
        removedCount: removedProductIds.length,
        removedProductIds
      });
    }
    
    const formattedCart = formatCart(cart);

    return successResponse(res, {
      totalItems: formattedCart.totalItems,
      totalAmount: formattedCart.totalAmount,
      itemCount: formattedCart.itemCount,
      items: formattedCart.items,
      removedProducts: removedProductIds.length > 0 ? {
        count: removedProductIds.length,
        productIds: removedProductIds
      } : undefined
    });
  } catch (error) {
    logger.error('Error obteniendo resumen del carrito:', {
      message: error.message,
      userId: req.user?.id
    });
    return serverErrorResponse(res, error);
  }
};
