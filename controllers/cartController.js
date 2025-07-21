import { cartService } from '../models/cartModel.js';
import { productService } from '../models/productModel.js';

// Función auxiliar para verificar autenticación
function requireAuth(req, res) {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Debes iniciar sesión o crear una cuenta para agregar productos al carrito.'
    });
    return false;
  }
  return true;
}

// Función auxiliar para obtener o crear el carrito del usuario
async function getOrCreateCart(userId) {
  let cart = await cartService.findByUserId(userId);
  if (!cart) {
    cart = await cartService.create(userId);
  }
  return cart;
}

// Función auxiliar para calcular el total de items
function getTotalItems(cart) {
  return cart.cart_items ? cart.cart_items.reduce((acc, item) => acc + item.quantity, 0) : 0;
}

export const getCart = async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;
    const cart = await getOrCreateCart(req.user.id);
    return res.json({
      success: true,
      data: cart,
      totalItems: getTotalItems(cart)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addToCart = async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;
    const { productId, quantity = 1 } = req.body;
    if (!productId || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Datos inválidos.' });
    }
    const product = await productService.findById(productId);
    if (!product || !product.is_active) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado o no disponible.' });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: `Solo hay ${product.stock} unidades disponibles.` });
    }
    const cart = await getOrCreateCart(req.user.id);
    await cartService.addItem(cart.id, productId, quantity, product.price);
    const updatedCart = await cartService.findByUserId(req.user.id);
    return res.json({
      success: true,
      message: 'Producto agregado al carrito exitosamente',
      data: updatedCart,
      totalItems: getTotalItems(updatedCart)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;
    const { productId, quantity } = req.body;
    if (!productId || !quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Datos inválidos.' });
    }
    const product = await productService.findById(productId);
    if (!product || !product.is_active) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado o no disponible.' });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: `Solo hay ${product.stock} unidades disponibles.` });
    }
    const cart = await cartService.findByUserId(req.user.id);
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Carrito no encontrado.' });
    }
    await cartService.updateItemQuantity(cart.id, productId, quantity);
    const updatedCart = await cartService.findByUserId(req.user.id);
    return res.json({
      success: true,
      message: 'Carrito actualizado exitosamente',
      data: updatedCart,
      totalItems: getTotalItems(updatedCart)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;
    const { productId } = req.params;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'ID de producto requerido.' });
    }
    const cart = await cartService.findByUserId(req.user.id);
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Carrito no encontrado.' });
    }
    await cartService.removeItem(cart.id, productId);
    const updatedCart = await cartService.findByUserId(req.user.id);
    return res.json({
      success: true,
      message: 'Producto eliminado del carrito exitosamente',
      data: updatedCart,
      totalItems: getTotalItems(updatedCart)
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;
    const cart = await cartService.findByUserId(req.user.id);
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Carrito no encontrado.' });
    }
    await cartService.clearCart(cart.id);
    const updatedCart = await cartService.findByUserId(req.user.id);
    return res.json({
      success: true,
      message: 'Carrito limpiado exitosamente',
      data: updatedCart,
      totalItems: 0
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCartSummary = async (req, res) => {
  try {
    if (!requireAuth(req, res)) return;
    const cart = await getOrCreateCart(req.user.id);
    const items = cart.cart_items || [];
    const totalItems = getTotalItems(cart);
    const totalAmount = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const itemCount = items.length;
    const summaryItems = items.map(item => ({
      productId: item.product_id,
      productName: item.products?.name || '',
      price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity
    }));
    return res.json({
      success: true,
      data: {
        totalItems,
        totalAmount,
        itemCount,
        items: summaryItems
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};