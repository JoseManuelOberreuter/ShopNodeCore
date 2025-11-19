import { supabase, supabaseAdmin } from '../database.js';
import logger from '../utils/logger.js';

export const productService = {
  // Crear producto (admin only - usa service role key)
  async create(productData) {
    if (!supabaseAdmin) {
      logger.error('supabaseAdmin is not available - SUPABASE_SERVICE_ROLE_KEY may not be configured');
      throw new Error('Service role key not configured. Admin operations are disabled.');
    }
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert([{
        name: productData.name,
        description: productData.description,
        price: productData.price,
        stock: productData.stock || 0,
        image: productData.image || '',
        category: productData.category,
        is_active: productData.isActive !== undefined ? productData.isActive : true,
        is_featured: productData.isFeatured !== undefined ? productData.isFeatured : false,
        is_on_sale: productData.isOnSale !== undefined ? productData.isOnSale : false,
        discount_percentage: productData.discountPercentage !== undefined ? productData.discountPercentage : null,
        sale_start_date: productData.saleStartDate || null,
        sale_end_date: productData.saleEndDate || null
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Buscar producto por ID
  async findById(id) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Buscar producto por ID sin filtrar por estado (útil para admin - usa service role key)
  async findByIdAny(id) {
    if (!supabaseAdmin) {
      logger.error('supabaseAdmin is not available - SUPABASE_SERVICE_ROLE_KEY may not be configured');
      throw new Error('Service role key not configured. Admin operations are disabled.');
    }
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Buscar todos los productos
  async findAll() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Buscar productos activos
  async findActive() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Buscar productos por categoría
  async findByCategory(category) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Actualizar producto (admin only - usa service role key)
  async update(id, updateData) {
    if (!supabaseAdmin) {
      logger.error('supabaseAdmin is not available - SUPABASE_SERVICE_ROLE_KEY may not be configured');
      throw new Error('Service role key not configured. Admin operations are disabled.');
    }
    const { data, error } = await supabaseAdmin
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      const notFoundError = new Error('Producto no encontrado');
      notFoundError.code = 'PGRST116';
      throw notFoundError;
    }
    return data;
  },

  // Eliminar producto (soft delete - admin only - usa service role key)
  async delete(id) {
    if (!supabaseAdmin) {
      logger.error('supabaseAdmin is not available - SUPABASE_SERVICE_ROLE_KEY may not be configured');
      throw new Error('Service role key not configured. Admin operations are disabled.');
    }
    const { data, error } = await supabaseAdmin
      .from('products')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      const notFoundError = new Error('Producto no encontrado');
      notFoundError.code = 'PGRST116';
      throw notFoundError;
    }
    return data;
  },

  // Buscar productos con filtros
  async findWithFilters(filters = {}) {
    let query = supabase
      .from('products')
      .select('*')
      .eq('is_active', true);

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

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Buscar productos destacados
  async findFeatured() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Buscar productos en oferta activos (verificando fechas)
  async findOnSale() {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('is_on_sale', true)
      .lte('sale_start_date', now)
      .gte('sale_end_date', now)
      .not('discount_percentage', 'is', null)
      .gt('discount_percentage', 0)
      .lt('discount_percentage', 100)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};

export default productService; 