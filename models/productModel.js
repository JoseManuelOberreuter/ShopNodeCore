import { supabase } from '../database.js';

export const productService = {
  // Crear producto
  async create(productData) {
    const { data, error } = await supabase
      .from('products')
      .insert([{
        name: productData.name,
        description: productData.description,
        price: productData.price,
        stock: productData.stock || 0,
        image: productData.image || '',
        category: productData.category,
        is_active: productData.isActive !== undefined ? productData.isActive : true
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

  // Actualizar producto
  async update(id, updateData) {
    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Eliminar producto (soft delete)
  async delete(id) {
    const { data, error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
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
  }
};

export default productService; 