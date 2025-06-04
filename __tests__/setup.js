// Configuración global para las pruebas
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret';
process.env.MONGO_URI = 'mongodb://localhost:27017/test_db';

// Mock de la conexión a la base de datos
jest.mock('../database.js', () => ({
  connect: jest.fn().mockResolvedValue(true)
}));

// Limpiar la consola antes de cada prueba
beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

// Limpiar todos los mocks después de cada prueba
afterEach(() => {
  jest.clearAllMocks();
}); 