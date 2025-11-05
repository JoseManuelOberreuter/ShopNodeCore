import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

// Don't throw error on import - let it fail gracefully
let supabase;

if (!supabaseKey) {
  console.error('⚠️ SUPABASE_KEY is not set - Supabase operations will fail');
  // Create a dummy client to prevent crashes on import
  supabase = createClient(supabaseUrl, '');
} else {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export { supabase };

// Función para inicializar la conexión (opcional - para mantener compatibilidad con el código existente)
const connectDB = async () => {
  if (!supabaseKey) {
    throw new Error('SUPABASE_KEY is required');
  }

  try {
    // Supabase no necesita conexión explícita, pero podemos hacer una consulta de prueba
    const { data, error } = await supabase.from('users').select('count').limit(1)
    if (error && error.code !== 'PGRST116') { // PGRST116 es "tabla no encontrada", lo cual es OK
      throw error
    }
    console.log('✅ Conectado a Supabase');
  } catch (error) {
    console.error('❌ Error al conectar a Supabase:', error);
    // Don't exit in serverless environments
    if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
      process.exit(1);
    }
    throw error; // Re-throw so caller can handle it
  }
};

export default connectDB;
