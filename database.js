import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sjgwwuawpfnvhzfgknus.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseKey) {
  throw new Error('SUPABASE_KEY is required')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Función para inicializar la conexión (opcional - para mantener compatibilidad con el código existente)
const connectDB = async () => {
  try {
    // Supabase no necesita conexión explícita, pero podemos hacer una consulta de prueba
    const { data, error } = await supabase.from('users').select('count').limit(1)
    if (error && error.code !== 'PGRST116') { // PGRST116 es "tabla no encontrada", lo cual es OK
      throw error
    }
    console.log('✅ Conectado a Supabase');
  } catch (error) {
    console.error('❌ Error al conectar a Supabase:', error);
    process.exit(1);
  }
};

export default connectDB;
