// utils/productQueryBuilder.js
import { supabase } from '../database.js';

/**
 * Construye query de productos con filtros, ordenamiento y paginación
 * @param {object} options - Opciones de query
 * @param {number} options.page - Página actual
 * @param {number} options.limit - Límite por página
 * @param {string} options.sortBy - Campo de ordenamiento
 * @param {string} options.sortOrder - Orden (asc/desc)
 * @param {string} options.category - Filtrar por categoría
 * @param {string} options.search - Buscar en nombre/descripción
 * @param {number} options.minPrice - Precio mínimo
 * @param {number} options.maxPrice - Precio máximo
 * @param {boolean|null} options.isActive - Filtrar por estado activo (null = todos)
 * @returns {Promise<{data: any[], count: number, pagination: object}>}
 */
export const buildProductQuery = async (options = {}) => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'created_at',
    sortOrder = 'desc',
    category,
    search,
    minPrice,
    maxPrice,
    isActive = null // null = todos, true/false = filtrar
  } = options;

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
  
  // Mapear y validar campo de ordenamiento
  const mappedSortBy = fieldMapping[sortBy] || sortBy;
  const finalSortBy = validSortFields.includes(mappedSortBy) ? mappedSortBy : 'created_at';

  // Construir query base
  let query = supabase
    .from('products')
    .select('*', { count: 'exact' });

  // Aplicar filtro de is_active si se especifica
  if (isActive !== null) {
    query = query.eq('is_active', isActive);
  }

  // Aplicar filtros
  if (category) {
    query = query.eq('category', category);
  }

  if (minPrice !== undefined && minPrice !== null) {
    query = query.gte('price', parseFloat(minPrice));
  }

  if (maxPrice !== undefined && maxPrice !== null) {
    query = query.lte('price', parseFloat(maxPrice));
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }

  // Aplicar ordenamiento y paginación
  const { data, error, count } = await query
    .order(finalSortBy, { ascending: sortOrder === 'asc' })
    .range(offset, offset + limitInt - 1);

  if (error) throw error;

  const totalPages = Math.ceil(count / limitInt);

  return {
    data,
    count,
    pagination: {
      currentPage: pageInt,
      totalPages,
      totalProducts: count,
      limit: limitInt,
      hasNextPage: pageInt < totalPages,
      hasPreviousPage: pageInt > 1
    }
  };
};

