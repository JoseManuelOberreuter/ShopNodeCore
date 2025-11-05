import { productService } from '../models/productModel.js';
import { supabase } from '../database.js';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';
import { validateProductId, validatePrice, validateStock, validateRequiredFields } from '../utils/productValidators.js';
import { buildProductQuery } from '../utils/productQueryBuilder.js';

dotenv.config();

// Configuración del Storage - usando SDK de Supabase

// Configurar multer para subida de imágenes
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se permiten: jpeg, png, webp'), false);
    }
  }
});

// Función para subir imagen a Supabase Storage usando SDK
const uploadImageToSupabase = async (file) => {
  const fileName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
  const filePath = fileName;

  try {
    // Usar el SDK de Supabase con el nombre del bucket
    const { data, error } = await supabase.storage
      .from('shop-core-bucket')  // Nombre del bucket
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600'
      });

    if (error) {
      throw new Error(`Error subiendo imagen: ${error.message}`);
    }

    // Obtener URL pública
    const { data: publicData } = supabase.storage
      .from('shop-core-bucket')  // Nombre correcto del bucket
      .getPublicUrl(filePath);
    
    return publicData.publicUrl;
    
  } catch (error) {
    logger.error('Error en uploadImageToSupabase:', { message: error.message });
    throw error;
  }
};

// Función para eliminar imagen de Supabase Storage usando SDK
const deleteImageFromSupabase = async (imageUrl) => {
  try {
    // Extraer el path del archivo de la URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1];
    
    // Usar el SDK de Supabase para eliminar
    const { error } = await supabase.storage
      .from('shop-core-bucket')  // Nombre correcto del bucket
      .remove([fileName]);

    if (error) {
      logger.error('Error eliminando imagen:', { message: error.message });
    }
    
  } catch (error) {
    logger.error('Error eliminando imagen:', { message: error.message });
  }
};

// Obtener todos los productos (público)           
export const getAllProducts = async (req, res) => {
  try {
    const { page, limit, category, search, minPrice, maxPrice, sortBy, sortOrder } = req.query;

    const result = await buildProductQuery({
      page,
      limit: limit || 10,
      sortBy,
      sortOrder,
      category,
      search,
      minPrice,
      maxPrice,
      isActive: true // Solo productos activos
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      filters: { category, search, minPrice, maxPrice }
    });
  } catch (error) {
    logger.error('Error obteniendo productos:', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener producto por ID (público)
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar ID
    const idValidation = validateProductId(id);
    if (!idValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: idValidation.error
      });
    }

    const product = await productService.findById(idValidation.productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    logger.error('Error obteniendo producto:', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Crear nuevo producto (solo admin)
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category, isActive } = req.body;

    // Validar campos requeridos
    const requiredValidation = validateRequiredFields({ name, description, price, category });
    if (!requiredValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: `Faltan campos requeridos: ${requiredValidation.missingFields.join(', ')}`
      });
    }

    // Validar precio
    const priceValidation = validatePrice(price);
    if (!priceValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: priceValidation.error
      });
    }

    // Validar stock (permitir vacío, se usa 0 por defecto)
    const stockValidation = validateStock(stock, true);
    if (!stockValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: stockValidation.error
      });
    }

    // Procesar imagen si se subió
    let imageUrl = '';
    if (req.file) {
      imageUrl = await uploadImageToSupabase(req.file);
    }

    // Crear producto
    const productData = {
      name: name.trim(),
      description: description.trim(),
      price: priceValidation.price,
      stock: stockValidation.stock || 0,
      category: category.trim(),
      image: imageUrl,
      isActive: isActive !== undefined ? isActive === 'true' : true
    };

    const newProduct = await productService.create(productData);

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: newProduct
    });
  } catch (error) {
    logger.error('Error creando producto:', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Actualizar producto (solo admin)
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, category, isActive, is_active } = req.body;

    // Validar ID
    const idValidation = validateProductId(id);
    if (!idValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: idValidation.error
      });
    }

    // Buscar producto existente
    const { data: existingProduct, error: findError } = await supabase
      .from('products')
      .select('*')
      .eq('id', idValidation.productId)
      .maybeSingle();

    if (findError) throw findError;
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Preparar datos de actualización
    const updateData = {};

    if (name) updateData.name = name.trim();
    if (description) updateData.description = description.trim();
    if (category) updateData.category = category.trim();

    // Manejar isActive
    const isActiveValue = isActive !== undefined ? isActive : is_active;
    if (isActiveValue !== undefined) {
      updateData.is_active = isActiveValue === 'true' || isActiveValue === true;
    }

    // Validar y actualizar precio
    if (price !== undefined && price !== '') {
      const priceValidation = validatePrice(price);
      if (!priceValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: priceValidation.error
        });
      }
      updateData.price = priceValidation.price;
    }

    // Validar y actualizar stock
    if (stock !== undefined && stock !== '') {
      const stockValidation = validateStock(stock, true);
      if (!stockValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: stockValidation.error
        });
      }
      updateData.stock = stockValidation.stock;
      
      // Si el stock llega a 0, desactivar el producto automáticamente
      if (stockValidation.stock === 0) {
        updateData.is_active = false;
      }
    }

    // Procesar nueva imagen si se subió
    if (req.file) {
      if (existingProduct.image) {
        await deleteImageFromSupabase(existingProduct.image);
      }
      updateData.image = await uploadImageToSupabase(req.file);
    }

    // Actualizar producto
    const updatedProduct = await productService.update(idValidation.productId, updateData);

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: updatedProduct
    });
  } catch (error) {
    logger.error('Error actualizando producto:', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Eliminar producto (solo admin) - Soft delete
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validar ID
    const idValidation = validateProductId(id);
    if (!idValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: idValidation.error
      });
    }
    
    // Verificar si el producto existe
    const existingProduct = await productService.findById(idValidation.productId);
    
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    
    // Eliminar producto (soft delete)
    await productService.delete(idValidation.productId);
    
    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
  } catch (error) {
    logger.error('Error eliminando producto:', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener todas las categorías (público)
export const getCategories = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .eq('is_active', true);

    if (error) throw error;

    // Obtener categorías únicas
    const categories = [...new Set(data.map(item => item.category))].filter(Boolean);

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error('Error obteniendo categorías:', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Actualizar stock (solo admin)
export const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, operation } = req.body;

    // Validar ID
    const idValidation = validateProductId(id);
    if (!idValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: idValidation.error
      });
    }

    // Validar stock
    const stockValidation = validateStock(stock);
    if (!stockValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: stockValidation.error
      });
    }

    // Verificar si el producto existe
    const existingProduct = await productService.findById(idValidation.productId);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    let newStock;
    if (operation === 'add') {
      newStock = existingProduct.stock + stockValidation.stock;
    } else if (operation === 'subtract') {
      newStock = Math.max(0, existingProduct.stock - stockValidation.stock);
    } else {
      newStock = stockValidation.stock; // Establecer stock absoluto
    }

    // Actualizar stock
    const updatedProduct = await productService.update(idValidation.productId, { stock: newStock });

    res.json({
      success: true,
      message: 'Stock actualizado exitosamente',
      data: {
        id: updatedProduct.id,
        name: updatedProduct.name,
        previousStock: existingProduct.stock,
        newStock: updatedProduct.stock,
        operation: operation || 'set'
      }
    });
  } catch (error) {
    logger.error('Error actualizando stock:', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener todos los productos para admin (incluye inactivos)
export const getAllProductsAdmin = async (req, res) => {
  try {
    const { page, limit, category, search, isActive, sortBy, sortOrder } = req.query;

    const result = await buildProductQuery({
      page,
      limit: limit || 20,
      sortBy,
      sortOrder,
      category,
      search,
      isActive: isActive !== undefined ? isActive === 'true' : null // Todos los productos
    });

    // Obtener estadísticas (solo para admin)
    const { data: statsData, error: statsError } = await supabase
      .from('products')
      .select('is_active, stock');

    if (statsError) throw statsError;

    const stats = {
      total: statsData.length,
      active: statsData.filter(p => p.is_active).length,
      inactive: statsData.filter(p => !p.is_active).length,
      lowStock: statsData.filter(p => p.stock < 5).length
    };

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      stats,
      filters: { category, search, isActive }
    });
  } catch (error) {
    logger.error('Error obteniendo productos admin:', { message: error.message });
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Export del middleware de upload
export { upload }; 