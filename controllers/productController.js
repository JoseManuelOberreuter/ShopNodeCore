import { productService } from '../models/productModel.js';
import { supabase } from '../database.js';
import multer from 'multer';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';
import { validateProductId, validatePrice, validateStock, validateProductRequiredFields, validateDiscountPercentage, validateSaleDates } from '../utils/validators.js';
import { buildProductQuery } from '../utils/productQueryBuilder.js';
import { uploadImage, deleteImage } from '../utils/imageHelper.js';
import { successResponse, errorResponse, notFoundResponse, serverErrorResponse } from '../utils/responseHelper.js';
import { formatProduct } from '../utils/formatters.js';

dotenv.config();

// Configure multer for image upload
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

// Get all products (public)
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
      isActive: true // Only active products
    });

    return successResponse(res, {
      products: result.data,
      pagination: result.pagination,
      filters: { category, search, minPrice, maxPrice }
    });
  } catch (error) {
    logger.error('Error obteniendo productos:', { message: error.message });
    return serverErrorResponse(res, error);
  }
};

// Get product by ID (public)
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    const idValidation = validateProductId(id);
    if (!idValidation.isValid) {
      return errorResponse(res, idValidation.error, 400);
    }

    const product = await productService.findById(idValidation.id);

    if (!product) {
      return notFoundResponse(res, 'Producto');
    }

    const formattedProduct = formatProduct(product);
    return successResponse(res, formattedProduct);

  } catch (error) {
    logger.error('Error obteniendo producto:', { message: error.message });
    return serverErrorResponse(res, error);
  }
};

// Create new product (admin only)
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, category, isActive, isFeatured, isOnSale, discountPercentage, saleStartDate, saleEndDate } = req.body;

    // Validate required fields
    const requiredValidation = validateProductRequiredFields({ name, description, price, category });
    if (!requiredValidation.isValid) {
      return errorResponse(res, `Faltan campos requeridos: ${requiredValidation.missingFields.join(', ')}`, 400);
    }

    // Validate price
    const priceValidation = validatePrice(price);
    if (!priceValidation.isValid) {
      return errorResponse(res, priceValidation.error, 400);
    }

    // Validate stock (allow empty, defaults to 0)
    const stockValidation = validateStock(stock, true);
    if (!stockValidation.isValid) {
      return errorResponse(res, stockValidation.error, 400);
    }

    // Validate discount percentage if on sale
    if (isOnSale === 'true' || isOnSale === true) {
      const discountValidation = validateDiscountPercentage(discountPercentage);
      if (!discountValidation.isValid) {
        return errorResponse(res, discountValidation.error, 400);
      }

      // Validate sale dates
      const datesValidation = validateSaleDates(saleStartDate, saleEndDate);
      if (!datesValidation.isValid) {
        return errorResponse(res, datesValidation.error, 400);
      }
    }

    // Process image if uploaded
    let imageUrl = '';
    if (req.file) {
      imageUrl = await uploadImage(req.file);
    }

    // Create product
    const productData = {
      name: name.trim(),
      description: description.trim(),
      price: priceValidation.price,
      stock: stockValidation.stock || 0,
      category: category.trim(),
      image: imageUrl,
      isActive: isActive !== undefined ? isActive === 'true' : true,
      isFeatured: isFeatured !== undefined ? (isFeatured === 'true' || isFeatured === true) : false,
      isOnSale: isOnSale !== undefined ? (isOnSale === 'true' || isOnSale === true) : false,
      discountPercentage: discountPercentage !== undefined && discountPercentage !== '' ? parseFloat(discountPercentage) : null,
      saleStartDate: saleStartDate || null,
      saleEndDate: saleEndDate || null
    };

    const newProduct = await productService.create(productData);
    const formattedProduct = formatProduct(newProduct);

    return successResponse(res, formattedProduct, 'Producto creado exitosamente', 201);

  } catch (error) {
    logger.error('Error creando producto:', { message: error.message });
    return serverErrorResponse(res, error);
  }
};

// Update product (admin only)
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, category, isActive, is_active, isFeatured, isOnSale, discountPercentage, saleStartDate, saleEndDate } = req.body;

    // Validate ID
    const idValidation = validateProductId(id);
    if (!idValidation.isValid) {
      return errorResponse(res, idValidation.error, 400);
    }

    // Find existing product
    const existingProduct = await productService.findByIdAny(idValidation.id);
    if (!existingProduct) {
      return notFoundResponse(res, 'Producto');
    }

    // Prepare update data
    const updateData = {};

    if (name) updateData.name = name.trim();
    if (description) updateData.description = description.trim();
    if (category) updateData.category = category.trim();
    
    // Handle isActive
    const isActiveValue = isActive !== undefined ? isActive : is_active;
    if (isActiveValue !== undefined) {
      updateData.is_active = isActiveValue === 'true' || isActiveValue === true;
    }

    // Handle isFeatured
    if (isFeatured !== undefined) {
      updateData.is_featured = isFeatured === 'true' || isFeatured === true;
    }

    // Handle isOnSale and related fields
    if (isOnSale !== undefined) {
      const onSaleValue = isOnSale === 'true' || isOnSale === true;
      updateData.is_on_sale = onSaleValue;

      if (onSaleValue) {
        // Validate discount percentage if on sale
        const discountValidation = validateDiscountPercentage(discountPercentage);
        if (!discountValidation.isValid) {
          return errorResponse(res, discountValidation.error, 400);
        }
        updateData.discount_percentage = discountValidation.percentage;

        // Validate sale dates
        const datesValidation = validateSaleDates(saleStartDate, saleEndDate);
        if (!datesValidation.isValid) {
          return errorResponse(res, datesValidation.error, 400);
        }
        updateData.sale_start_date = saleStartDate || null;
        updateData.sale_end_date = saleEndDate || null;
      } else {
        // If turning off sale, clear sale-related fields
        updateData.discount_percentage = null;
        updateData.sale_start_date = null;
        updateData.sale_end_date = null;
      }
    } else if (discountPercentage !== undefined || saleStartDate !== undefined || saleEndDate !== undefined) {
      // If sale fields are being updated but isOnSale is not explicitly set
      if (existingProduct.is_on_sale) {
        if (discountPercentage !== undefined) {
          const discountValidation = validateDiscountPercentage(discountPercentage);
          if (!discountValidation.isValid) {
            return errorResponse(res, discountValidation.error, 400);
          }
          updateData.discount_percentage = discountValidation.percentage;
        }
        if (saleStartDate !== undefined || saleEndDate !== undefined) {
          const datesValidation = validateSaleDates(
            saleStartDate !== undefined ? saleStartDate : existingProduct.sale_start_date,
            saleEndDate !== undefined ? saleEndDate : existingProduct.sale_end_date
          );
          if (!datesValidation.isValid) {
            return errorResponse(res, datesValidation.error, 400);
          }
          if (saleStartDate !== undefined) updateData.sale_start_date = saleStartDate || null;
          if (saleEndDate !== undefined) updateData.sale_end_date = saleEndDate || null;
        }
      }
    }

    // Validate and update price
    if (price !== undefined && price !== '') {
      const priceValidation = validatePrice(price);
      if (!priceValidation.isValid) {
        return errorResponse(res, priceValidation.error, 400);
      }
      updateData.price = priceValidation.price;
    }

    // Validate and update stock
    if (stock !== undefined && stock !== '') {
      const stockValidation = validateStock(stock, true);
      if (!stockValidation.isValid) {
        return errorResponse(res, stockValidation.error, 400);
      }
      updateData.stock = stockValidation.stock;
      
      // If stock reaches 0, deactivate product automatically
      if (stockValidation.stock === 0) {
        updateData.is_active = false;
      }
    }

    // Process new image if uploaded
    if (req.file) {
      if (existingProduct.image) {
        try {
          await deleteImage(existingProduct.image);
        } catch (error) {
          logger.warn('Error eliminando imagen anterior:', { message: error.message });
        }
      }
      updateData.image = await uploadImage(req.file);
    }

    // Update product
    const updatedProduct = await productService.update(idValidation.id, updateData);
    const formattedProduct = formatProduct(updatedProduct);

    return successResponse(res, formattedProduct, 'Producto actualizado exitosamente');

  } catch (error) {
    logger.error('Error actualizando producto:', { message: error.message });
    return serverErrorResponse(res, error);
  }
};

// Delete product (admin only) - Soft delete
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    const idValidation = validateProductId(id);
    if (!idValidation.isValid) {
      return errorResponse(res, idValidation.error, 400);
    }
    
    // Verify if product exists
    const existingProduct = await productService.findById(idValidation.id);
    
    if (!existingProduct) {
      return notFoundResponse(res, 'Producto');
    }
    
    // Delete product (soft delete)
    await productService.delete(idValidation.id);
    
    return successResponse(res, null, 'Producto eliminado exitosamente');

  } catch (error) {
    logger.error('Error eliminando producto:', { message: error.message });
    return serverErrorResponse(res, error);
  }
};

// Get all categories (public)
export const getCategories = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .eq('is_active', true);

    if (error) throw error;

    // Get unique categories
    const categories = [...new Set(data.map(item => item.category))].filter(Boolean);

    return successResponse(res, categories);

  } catch (error) {
    logger.error('Error obteniendo categorías:', { message: error.message });
    return serverErrorResponse(res, error);
  }
};

// Update stock (admin only)
export const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, operation } = req.body;

    // Validate ID
    const idValidation = validateProductId(id);
    if (!idValidation.isValid) {
      return errorResponse(res, idValidation.error, 400);
    }

    // Validate stock
    const stockValidation = validateStock(stock);
    if (!stockValidation.isValid) {
      return errorResponse(res, stockValidation.error, 400);
    }

    // Verify if product exists
    const existingProduct = await productService.findById(idValidation.id);
    if (!existingProduct) {
      return notFoundResponse(res, 'Producto');
    }

    let newStock;
    if (operation === 'add') {
      newStock = existingProduct.stock + stockValidation.stock;
    } else if (operation === 'subtract') {
      newStock = Math.max(0, existingProduct.stock - stockValidation.stock);
    } else {
      newStock = stockValidation.stock; // Set absolute stock
    }

    // Update stock
    const updatedProduct = await productService.update(idValidation.id, { stock: newStock });
    const formattedProduct = formatProduct(updatedProduct);

    return successResponse(res, {
      ...formattedProduct,
        previousStock: existingProduct.stock,
        operation: operation || 'set'
    }, 'Stock actualizado exitosamente');

  } catch (error) {
    logger.error('Error actualizando stock:', { message: error.message });
    return serverErrorResponse(res, error);
  }
};

// Get all products for admin (includes inactive)
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
      isActive: isActive !== undefined ? isActive === 'true' : null // All products
    });

    // Get statistics (admin only)
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

    return successResponse(res, {
      products: result.data,
      pagination: result.pagination,
      stats,
      filters: { category, search, isActive }
    });

  } catch (error) {
    logger.error('Error obteniendo productos admin:', { message: error.message });
    return serverErrorResponse(res, error);
  }
};

// Get featured products (public)
export const getFeaturedProducts = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const limitInt = parseInt(limit) || 10;
    const pageInt = parseInt(page) || 1;

    const result = await buildProductQuery({
      page: pageInt,
      limit: limitInt,
      isActive: true,
      isFeatured: true
    });

    return successResponse(res, {
      products: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Error obteniendo productos destacados:', { message: error.message });
    return serverErrorResponse(res, error);
  }
};

// Get products on sale (public)
export const getOnSaleProducts = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const limitInt = parseInt(limit) || 10;
    const pageInt = parseInt(page) || 1;

    const result = await buildProductQuery({
      page: pageInt,
      limit: limitInt,
      isActive: true,
      isOnSale: true
    });

    return successResponse(res, {
      products: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Error obteniendo productos en oferta:', { message: error.message });
    return serverErrorResponse(res, error);
  }
};

// Export upload middleware
export { upload }; 
