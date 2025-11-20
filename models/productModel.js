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
    
    logger.info('ProductModel.update called:', { id, updateData: cleanData, originalKeys: Object.keys(updateData) });
    
    // First verify the product exists
    const { data: existingProduct, error: findError } = await supabaseAdmin
      .from('products')
      .select('id, is_featured, is_on_sale')
      .eq('id', id)
      .maybeSingle();
    
    if (findError) {
      logger.error('Error finding product before update:', { id, error: findError });
      throw findError;
    }
    
    if (!existingProduct) {
      logger.error('Product not found before update:', { id });
      const notFoundError = new Error(`Producto con ID ${id} no encontrado`);
      notFoundError.code = 'PGRST116';
      throw notFoundError;
    }
    
    logger.info('Product before update:', { id, existing: existingProduct, willUpdate: cleanData });
    
    // Perform the update WITHOUT select first (this avoids RLS issues with UPDATE().select())
    const { error: updateError } = await supabaseAdmin
      .from('products')
      .update(cleanData)
      .eq('id', id);

    if (updateError) {
      logger.error('Error updating product:', { id, updateData: cleanData, error: updateError });
      throw updateError;
    }
    
    logger.info('Update command executed, fetching updated product...');
    
    // Wait a small moment to ensure the update is committed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Now fetch the updated product separately (this uses the SELECT policy which should work)
    const { data, error: selectError } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (selectError) {
      logger.error('Error fetching updated product:', { id, error: selectError });
      throw selectError;
    }
    
    if (!data) {
      logger.error('Updated product not found after update:', { id, updateData: cleanData });
      const notFoundError = new Error(`Producto con ID ${id} no encontrado después de la actualización`);
      notFoundError.code = 'PGRST116';
      throw notFoundError;
    }
    
    // Verify the update actually changed the values
    const changedFields = Object.keys(cleanData).filter(key => {
      const oldValue = existingProduct[key];
      const newValue = data[key];
      return JSON.stringify(oldValue) !== JSON.stringify(newValue);
    });
    
    if (changedFields.length === 0 && Object.keys(cleanData).length > 0) {
      logger.warn('Update executed but no fields changed:', { 
        id, 
        updateData: cleanData, 
        existing: existingProduct,
        after: data 
      });
    }
    
    logger.info('Product updated successfully:', { 
      id, 
      updatedFields: Object.keys(cleanData),
      changedFields,
      before: existingProduct,
      after: data
    });
    
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