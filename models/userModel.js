import { supabase } from '../database.js';

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
        direccion: userData.direccion || ''
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Buscar usuario por email
  async findByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Buscar usuario por ID
  async findById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Buscar usuario por token de verificación
  async findByVerificationToken(token) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('verification_token', token)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Actualizar usuario
  async update(id, updateData) {
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Eliminar usuario
  async delete(id) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Buscar todos los usuarios
  async findAll() {
    const { data, error } = await supabase
      .from('users')
      .select('*');

    if (error) throw error;
    return data;
  }
};

// Mantener compatibilidad con el código existente
export default userService;
