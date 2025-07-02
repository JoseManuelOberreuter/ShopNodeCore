const Cart = require('../models/cartModel');
const Product = require('../models/productModel');

// 📌 OBTENER CARRITO DEL USUARIO
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    
    let cart = await Cart.findOne({ user: userId })
      .populate('items.product', 'name price image stock isActive');
    
    if (!cart) {
      // Crear carrito vacío si no existe
      cart = new Cart({ user: userId, items: [] });
      await cart.save();
    }

    // Filtrar productos que ya no están activos
    cart.items = cart.items.filter(item => 
      item.product && item.product.isActive
    );

    // Recalcular totales
    await cart.save();

    res.status(200).json({
      success: true,
      data: cart,
      totalItems: cart.getTotalItems()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener carrito',
      error: error.message
    });
  }
};

// 📌 AGREGAR PRODUCTO AL CARRITO
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    // Validar entrada
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'ID del producto es requerido'
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'La cantidad debe ser mayor a 0'
      });
    }

    // Verificar que el producto existe y está activo
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado o no disponible'
      });
    }

    // Verificar stock disponible
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Solo hay ${product.stock} unidades disponibles`
      });
    }

    // Buscar o crear carrito
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Buscar si el producto ya existe en el carrito
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Actualizar cantidad si ya existe
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      
      // Verificar stock total
      if (product.stock < newQuantity) {
        return res.status(400).json({
          success: false,
          message: `Solo hay ${product.stock} unidades disponibles. Ya tienes ${cart.items[existingItemIndex].quantity} en tu carrito`
        });
      }

      cart.items[existingItemIndex].quantity = newQuantity;
      cart.items[existingItemIndex].price = product.price; // Actualizar precio por si cambió
    } else {
      // Agregar nuevo producto al carrito
      cart.items.push({
        product: productId,
        quantity: quantity,
        price: product.price
      });
    }

    await cart.save();
    
    // Populate para respuesta
    await cart.populate('items.product', 'name price image stock isActive');

    res.status(200).json({
      success: true,
      message: 'Producto agregado al carrito exitosamente',
      data: cart,
      totalItems: cart.getTotalItems()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al agregar producto al carrito',
      error: error.message
    });
  }
};

// 📌 SINCRONIZAR CARRITO LOCAL CON BACKEND
const syncLocalCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items } = req.body;

    // Validar entrada
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Items del carrito son requeridos y deben ser un array'
      });
    }

    // Validar que cada item tenga los campos necesarios
    for (let item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Cada item debe tener productId y quantity válidos'
        });
      }
    }

    // Buscar o crear carrito del usuario
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Procesar cada item del carrito local
    for (let localItem of items) {
      const { productId, quantity } = localItem;

      // Verificar que el producto existe y está activo
      const product = await Product.findById(productId);
      if (!product || !product.isActive) {
        console.log(`Producto ${productId} no encontrado o inactivo, omitiendo...`);
        continue; // Omitir este producto y continuar con los demás
      }

      // Buscar si el producto ya existe en el carrito del backend
      const existingItemIndex = cart.items.findIndex(
        item => item.product.toString() === productId
      );

      if (existingItemIndex > -1) {
        // Producto ya existe, sumar cantidades
        const newQuantity = cart.items[existingItemIndex].quantity + quantity;
        
        // Verificar stock disponible
        if (product.stock < newQuantity) {
          // Si no hay suficiente stock, usar el máximo disponible
          cart.items[existingItemIndex].quantity = Math.min(product.stock, newQuantity);
        } else {
          cart.items[existingItemIndex].quantity = newQuantity;
        }
        
        // Actualizar precio actual del producto
        cart.items[existingItemIndex].price = product.price;
      } else {
        // Producto nuevo, agregarlo al carrito
        const finalQuantity = Math.min(quantity, product.stock);
        
        if (finalQuantity > 0) {
          cart.items.push({
            product: productId,
            quantity: finalQuantity,
            price: product.price
          });
        }
      }
    }

    await cart.save();
    
    // Populate para respuesta
    await cart.populate('items.product', 'name price image stock isActive');

    res.status(200).json({
      success: true,
      message: 'Carrito sincronizado exitosamente',
      data: cart,
      totalItems: cart.getTotalItems()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al sincronizar carrito',
      error: error.message
    });
  }
};

// 📌 ACTUALIZAR CANTIDAD DE PRODUCTO EN CARRITO
const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    if (!productId || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID del producto y cantidad válida son requeridos'
      });
    }

    // Verificar que el producto existe y está activo
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado o no disponible'
      });
    }

    // Verificar stock disponible
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Solo hay ${product.stock} unidades disponibles`
      });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Carrito no encontrado'
      });
    }

    const itemIndex = cart.items.findIndex(
      item => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado en el carrito'
      });
    }

    // Actualizar cantidad y precio
    cart.items[itemIndex].quantity = quantity;
    cart.items[itemIndex].price = product.price;

    await cart.save();
    await cart.populate('items.product', 'name price image stock isActive');

    res.status(200).json({
      success: true,
      message: 'Carrito actualizado exitosamente',
      data: cart,
      totalItems: cart.getTotalItems()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar carrito',
      error: error.message
    });
  }
};

// 📌 ELIMINAR PRODUCTO DEL CARRITO
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Carrito no encontrado'
      });
    }

    // Filtrar el producto a eliminar
    cart.items = cart.items.filter(
      item => item.product.toString() !== productId
    );

    await cart.save();
    await cart.populate('items.product', 'name price image stock isActive');

    res.status(200).json({
      success: true,
      message: 'Producto eliminado del carrito exitosamente',
      data: cart,
      totalItems: cart.getTotalItems()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar producto del carrito',
      error: error.message
    });
  }
};

// 📌 LIMPIAR CARRITO COMPLETO
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Carrito no encontrado'
      });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Carrito limpiado exitosamente',
      data: cart,
      totalItems: 0
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al limpiar carrito',
      error: error.message
    });
  }
};

// 📌 OBTENER RESUMEN DEL CARRITO
const getCartSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const cart = await Cart.findOne({ user: userId })
      .populate('items.product', 'name price image');

    if (!cart || cart.items.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalItems: 0,
          totalAmount: 0,
          items: []
        }
      });
    }

    const summary = {
      totalItems: cart.getTotalItems(),
      totalAmount: cart.totalAmount,
      itemCount: cart.items.length,
      items: cart.items.map(item => ({
        productId: item.product._id,
        productName: item.product.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity
      }))
    };

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen del carrito',
      error: error.message
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  syncLocalCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartSummary
}; 