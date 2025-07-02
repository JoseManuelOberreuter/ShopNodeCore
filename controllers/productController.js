const Product = require('../models/productModel');
const multer = require('multer');
const path = require('path');

// Configuración de multer para subir imágenes de productos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/products/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  }
});

// 📌 OBTENER TODOS LOS PRODUCTOS (Público)
const getAllProducts = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      minPrice, 
      maxPrice, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Construir filtros
    const filters = { isActive: true };
    
    if (category) {
      filters.category = { $regex: category, $options: 'i' };
    }
    
    if (minPrice || maxPrice) {
      filters.price = {};
      if (minPrice) filters.price.$gte = parseFloat(minPrice);
      if (maxPrice) filters.price.$lte = parseFloat(maxPrice);
    }
    
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Construir ordenamiento
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: sortOptions
    };

    const products = await Product.find(filters)
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(filters);

    res.status(200).json({
      success: true,
      data: products,
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
      message: 'Error al obtener productos',
      error: error.message
    });
  }
};

// 📌 OBTENER TODOS LOS PRODUCTOS PARA ADMIN (Sin filtros)
const getAllProductsAdmin = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Construir ordenamiento
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Sin filtros - obtener TODOS los productos (activos e inactivos)
    const products = await Product.find({})
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments({});

    // Obtener estadísticas adicionales para el admin
    const stats = {
      total: total,
      active: await Product.countDocuments({ isActive: true }),
      inactive: await Product.countDocuments({ isActive: false }),
      lowStock: await Product.countDocuments({ stock: { $lte: 10 }, isActive: true })
    };

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      },
      stats: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos para administrador',
      error: error.message
    });
  }
};

// 📌 OBTENER PRODUCTO POR ID (Público)
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener producto',
      error: error.message
    });
  }
};

// 📌 CREAR PRODUCTO (Solo Admin)
const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category } = req.body;
    
    // Validar campos requeridos
    if (!name || !description || !price || !stock || !category) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      });
    }

    const productData = {
      name,
      description,
      price: parseFloat(price),
      stock: parseInt(stock),
      category
    };

    // Si se subió una imagen
    if (req.file) {
      productData.image = `/uploads/products/${req.file.filename}`;
    }

    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al crear producto',
      error: error.message
    });
  }
};

// 📌 ACTUALIZAR PRODUCTO (Solo Admin)
const updateProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category, isActive } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (price) updateData.price = parseFloat(price);
    if (stock !== undefined) updateData.stock = parseInt(stock);
    if (category) updateData.category = category;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Si se subió una nueva imagen
    if (req.file) {
      updateData.image = `/uploads/products/${req.file.filename}`;
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar producto',
      error: error.message
    });
  }
};

// 📌 ELIMINAR PRODUCTO (Solo Admin - Soft Delete)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar producto',
      error: error.message
    });
  }
};

// 📌 OBTENER CATEGORÍAS (Público)
const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener categorías',
      error: error.message
    });
  }
};

// 📌 ACTUALIZAR STOCK (Solo Admin)
const updateStock = async (req, res) => {
  try {
    const { stock } = req.body;
    
    if (stock === undefined || stock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock debe ser un número mayor o igual a 0'
      });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { stock: parseInt(stock) },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Stock actualizado exitosamente',
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar stock',
      error: error.message
    });
  }
};

module.exports = {
  getAllProducts,
  getAllProductsAdmin,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  updateStock,
  upload
}; 