import { supabase, supabaseAdmin } from '../database.js';

// Funciones para manejar usuarios
export const userService = {
  // Crear usuario
  async create(userData) {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role || 'user',
        is_verified: userData.isVerified || false,
        verification_token: userData.verificationToken,
        avatar: userData.avatar || '',
        telefono: userData.telefono || '',
        fecha_nacimiento: userData.fechaNacimiento,
        direccion: userData.direccion || '',
        last_login: null // Inicialmente null hasta el primer login
        // created_at y updated_at se manejan automáticamente por Supabase
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Buscar usuario por email (excluye eliminados)
  async findByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .is('deleted_at', null)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Buscar usuario por email sin filtrar eliminados (útil para verificar unicidad)
  async findByEmailAny(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Buscar usuario por ID (excluye eliminados)
  async findById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Buscar usuario por ID sin filtrar eliminados (útil para admin)
  async findByIdAny(id) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Buscar usuario por token de verificación (excluye eliminados)
  async findByVerificationToken(token) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('verification_token', token)
      .is('deleted_at', null)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Actualizar usuario (usa service role key para operaciones administrativas)
  async update(id, updateData, isAdminOperation = false) {
    // Agregar updated_at automáticamente
    const dataToUpdate = {
      ...updateData,
      updated_at: new Date().toISOString()
    };

    // Usar supabaseAdmin para operaciones administrativas, supabase para operaciones de usuario
    const client = isAdminOperation ? supabaseAdmin : supabase;
    const { data, error } = await client
      .from('users')
      .update(dataToUpdate)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      const notFoundError = new Error('Usuario no encontrado');
      notFoundError.code = 'PGRST116';
      throw notFoundError;
    }
    return data;
  },

  // Eliminar usuario (soft delete - admin only - usa service role key)
  async delete(id) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ 
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      const notFoundError = new Error('Usuario no encontrado');
      notFoundError.code = 'PGRST116';
      throw notFoundError;
    }
    return data;
  },

  // Buscar todos los usuarios (excluye eliminados)
  async findAll() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .is('deleted_at', null);

    if (error) throw error;
    return data;
  },

  // Buscar todos los usuarios incluyendo eliminados (útil para admin - usa service role key)
  async findAllIncludingDeleted() {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*');

    if (error) throw error;
    return data;
  },

  // Restaurar usuario eliminado (soft delete - admin only - usa service role key)
  async restore(id) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ 
        deleted_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      const notFoundError = new Error('Usuario no encontrado');
      notFoundError.code = 'PGRST116';
      throw notFoundError;
    }
    return data;
  },

  // Actualizar último login
  async updateLastLogin(id) {
    const { data, error } = await supabase
      .from('users')
      .update({ 
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// Mantener compatibilidad con el código existente
export default userService;
