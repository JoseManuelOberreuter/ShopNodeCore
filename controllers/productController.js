import { productService } from '../models/productModel.js';
import { supabase } from '../database.js';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import dotenv from 'dotenv';

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
    console.error('Error en uploadImageToSupabase:', error);
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
      console.error('Error eliminando imagen:', error.message);
    }
    
  } catch (error) {
    console.error('Error eliminando imagen:', error);
  }
};

// Obtener todos los productos (público)           
export const getAllProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      search,
      minPrice,
      maxPrice,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const offset = (pageInt - 1) * limitInt;

    // Mapeo de campos para compatibilidad camelCase -> snake_case
    const fieldMapping = {
      'createdAt': 'created_at',
      'updatedAt': 'updated_at',
      'isActive': 'is_active'
    };

    // Campos válidos para ordenamiento
    const validSortFields = ['id', 'name', 'price', 'stock', 'category', 'created_at', 'updated_at'];
    
    // Mapear campo de ordenamiento si es necesario
    const mappedSortBy = fieldMapping[sortBy] || sortBy;
    
    // Validar campo de ordenamiento
    const finalSortBy = validSortFields.includes(mappedSortBy) ? mappedSortBy : 'created_at';

    // Construir filtros
    const filters = {};
    if (category) filters.category = category;
    if (search) filters.search = search;
    if (minPrice) filters.minPrice = parseFloat(minPrice);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);

    // Construir query base
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('is_active', true);

    // Aplicar filtros
    if (filters.category) {
      query = query.eq('category', filters.category);
    }

    if (filters.minPrice) {
      query = query.gte('price', filters.minPrice);
    }

    if (filters.maxPrice) {
      query = query.lte('price', filters.maxPrice);
    }

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Aplicar ordenamiento y paginación
    const { data, error, count } = await query
      .order(finalSortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limitInt - 1);

    if (error) throw error;

    const totalPages = Math.ceil(count / limitInt);

    res.json({
      success: true,
      data,
      pagination: {
        currentPage: pageInt,
        totalPages,
        totalProducts: count,
        limit: limitInt,
        hasNextPage: pageInt < totalPages,
        hasPreviousPage: pageInt > 1
      },
      filters: filters
    });
  } catch (error) {
    console.error('Error obteniendo productos:', error);
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

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de producto inválido'
      });
    }

    const product = await productService.findById(parseInt(id));

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
    console.error('Error obteniendo producto:', error);
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

    // Validación de datos requeridos
    if (!name || !description || !price || !category) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos: name, description, price, category'
      });
    }

    // Validar precio
    const priceFloat = parseFloat(price);
    if (isNaN(priceFloat) || priceFloat < 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio debe ser un número válido mayor o igual a 0'
      });
    }

    // Validar stock
    const stockInt = stock ? parseInt(stock) : 0;
    if (isNaN(stockInt) || stockInt < 0) {
      return res.status(400).json({
        success: false,
        message: 'El stock debe ser un número entero mayor o igual a 0'
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
      price: priceFloat,
      stock: stockInt,
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
    console.error('Error creando producto:', error);
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
    const { name, description, price, stock, category, isActive } = req.body;

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de producto inválido'
      });
    }

    const productId = parseInt(id);

    // Verificar si el producto existe
    const existingProduct = await productService.findById(productId);
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
    if (isActive !== undefined) updateData.is_active = isActive === 'true';

    // Validar y actualizar precio
    if (price !== undefined && price !== '') {  // Solo validar si se envía un precio
      const priceFloat = parseFloat(price);
      if (isNaN(priceFloat) || priceFloat < 0) {
        return res.status(400).json({
          success: false,
          message: 'El precio debe ser un número válido mayor o igual a 0'
        });
      }
      updateData.price = priceFloat;
    }

    // Validar y actualizar stock
    if (stock !== undefined && stock !== '') {  // Solo validar si se envía un stock
      const stockInt = parseInt(stock);
      if (isNaN(stockInt) || stockInt < 0) {
        return res.status(400).json({
          success: false,
          message: 'El stock debe ser un número entero mayor o igual a 0'
        });
      }
      updateData.stock = stockInt;
    }

    // Procesar nueva imagen si se subió
    if (req.file) {
      // Eliminar imagen anterior si existe
      if (existingProduct.image) {
        await deleteImageFromSupabase(existingProduct.image);
      }
      
      // Subir nueva imagen
      updateData.image = await uploadImageToSupabase(req.file);
    }

    // Actualizar producto
    const updatedProduct = await productService.update(productId, updateData);

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error actualizando producto:', error);
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

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de producto inválido'
      });
    }

    const productId = parseInt(id);

    // Verificar si el producto existe
    const existingProduct = await productService.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Eliminar producto (soft delete)
    await productService.delete(productId);

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando producto:', error);
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
    console.error('Error obteniendo categorías:', error);
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

    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        message: 'ID de producto inválido'
      });
    }

    const productId = parseInt(id);

    // Validar stock
    const stockInt = parseInt(stock);
    if (isNaN(stockInt) || stockInt < 0) {
      return res.status(400).json({
        success: false,
        message: 'El stock debe ser un número entero mayor o igual a 0'
      });
    }

    // Verificar si el producto existe
    const existingProduct = await productService.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    let newStock;
    if (operation === 'add') {
      newStock = existingProduct.stock + stockInt;
    } else if (operation === 'subtract') {
      newStock = Math.max(0, existingProduct.stock - stockInt);
    } else {
      newStock = stockInt; // Establecer stock absoluto
    }

    // Actualizar stock
    const updatedProduct = await productService.update(productId, { stock: newStock });

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
    console.error('Error actualizando stock:', error);
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
    const {
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'desc',
      category,
      search,
      isActive
    } = req.query;

    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const offset = (pageInt - 1) * limitInt;

    // Mapeo de campos para compatibilidad camelCase -> snake_case
    const fieldMapping = {
      'createdAt': 'created_at',
      'updatedAt': 'updated_at',
      'isActive': 'is_active'
    };

    // Campos válidos para ordenamiento
    const validSortFields = ['id', 'name', 'price', 'stock', 'category', 'created_at', 'updated_at'];
    
    // Mapear campo de ordenamiento si es necesario
    const mappedSortBy = fieldMapping[sortBy] || sortBy;
    
    // Validar campo de ordenamiento
    const finalSortBy = validSortFields.includes(mappedSortBy) ? mappedSortBy : 'created_at';

    // Construir query base sin filtro de is_active
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' });

    // Aplicar filtros
    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive === 'true');
    }

    // Aplicar ordenamiento y paginación
    const { data, error, count } = await query
      .order(finalSortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limitInt - 1);

    if (error) throw error;

    // Obtener estadísticas
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

    const totalPages = Math.ceil(count / limitInt);

    res.json({
      success: true,
      data,
      pagination: {
        currentPage: pageInt,
        totalPages,
        totalProducts: count,
        limit: limitInt,
        hasNextPage: pageInt < totalPages,
        hasPreviousPage: pageInt > 1
      },
      stats,
      filters: {
        category,
        search,
        isActive
      }
    });
  } catch (error) {
    console.error('Error obteniendo productos admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Export del middleware de upload
export { upload }; 