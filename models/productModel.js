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
    
    // Clean updateData to remove any undefined values that might cause issues
    const cleanData = Object.keys(updateData).reduce((acc, key) => {
      const value = updateData[key];
      if (value !== undefined && value !== null && value !== 'undefined') {
        acc[key] = value;
      }
      return acc;
    }, {});
    
    // Use console.log for Vercel visibility
    console.log('🔵 ProductModel.update called:', JSON.stringify({ id, updateData: cleanData }));
    
    // First verify the product exists
    const { data: existingProduct, error: findError } = await supabaseAdmin
      .from('products')
      .select('id, is_featured, is_on_sale, name')
      .eq('id', id)
      .maybeSingle();
    
    if (findError) {
      console.error('❌ Error finding product:', findError);
      throw findError;
    }
    
    if (!existingProduct) {
      console.error('❌ Product not found:', id);
      throw new Error(`Producto con ID ${id} no encontrado`);
    }
    
    console.log('🔵 Product BEFORE update:', JSON.stringify(existingProduct));
    console.log('🔵 Will update with:', JSON.stringify(cleanData));
    
    // Perform the update
    const { error: updateError, data: updateResult } = await supabaseAdmin
      .from('products')
      .update(cleanData)
      .eq('id', id)
      .select('id'); // Select just id to verify update worked

    if (updateError) {
      console.error('❌ Update error:', updateError);
      throw updateError;
    }
    
    console.log('🔵 Update result:', JSON.stringify(updateResult));
    
    // Wait a moment for consistency
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Fetch the updated product
    const { data, error: selectError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (selectError) {
      console.error('❌ Select error:', selectError);
      throw selectError;
    }
    
    if (!data) {
      console.error('❌ No data after update');
      throw new Error(`Producto con ID ${id} no encontrado después de la actualización`);
    }
    
    console.log('🔵 Product AFTER update:', JSON.stringify({
      id: data.id,
      name: data.name,
      is_featured: data.is_featured,
      is_on_sale: data.is_on_sale
    }));
    
    // Verify changes
    const changed = Object.keys(cleanData).some(key => {
      return JSON.stringify(existingProduct[key]) !== JSON.stringify(data[key]);
    });
    
    if (!changed && Object.keys(cleanData).length > 0) {
      console.warn('⚠️ WARNING: Update executed but values did not change!');
      console.warn('Before:', JSON.stringify(existingProduct));
      console.warn('After:', JSON.stringify(data));
      console.warn('Update data:', JSON.stringify(cleanData));
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