// Carga variables de entorno
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import swaggerConfig from './swagger/swagger.js';

const app = express();

// Rutas del sistema de carrito de compras
import userRoutes from './routes/userRouter.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

// 📁 Crear carpetas necesarias si no existen
const ensureDirectories = () => {
  const directories = [
    'uploads', 
    'uploads/products'
  ];
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Carpeta creada automáticamente: ${dir}`);
    }
  });
};
ensureDirectories();

// Middlewares globales
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Swagger documentation
app.use('/api-docs', swaggerConfig.serve, swaggerConfig.setup);

// Rutas del sistema
app.use('/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

// Servir archivos estáticos (imágenes de productos)
app.use('/uploads', express.static('uploads'));

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    message: '🛒 Sistema de Carrito de Compras - API REST',
    version: '2.0.0',
    description: 'Sistema completo de e-commerce con gestión de usuarios, productos, carritos y órdenes',
    features: [
      '✅ Autenticación JWT con roles (user/admin)',
      '✅ Catálogo de productos con imágenes',
      '✅ Carrito de compras inteligente',
      '✅ Sistema de órdenes con tracking',
      '✅ Gestión automática de stock',
      '✅ Panel de administración',
      '✅ API REST documentada'
    ],
    endpoints: {
      documentation: '/api-docs',
      authentication: '/users',
      products: '/api/products',
      cart: '/api/cart',
      orders: '/api/orders'
    },
    roles: {
      user: 'Compras, carrito personal, órdenes propias',
      admin: 'Gestión completa + estadísticas + control de stock'
    }
  });
});

export default app;
