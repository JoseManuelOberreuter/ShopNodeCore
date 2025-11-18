import { jest, beforeEach, afterEach } from '@jest/globals';

// Configuración global para las pruebas
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_KEY = 'test_key';

// Mock de la conexión a Supabase (se define en cada test que lo necesite)

// Limpiar la consola antes de cada prueba
beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

// Limpiar todos los mocks después de cada prueba
afterEach(() => {
  jest.clearAllMocks();
});