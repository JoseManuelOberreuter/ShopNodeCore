// Carga variables de entorno
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import swaggerConfig from './swagger/swagger.js';
import logger from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';

const app = express();

// Rutas del sistema de carrito de compras
import userRoutes from './routes/userRouter.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

const isDevelopment = process.env.NODE_ENV !== 'production';

// 📁 Crear carpetas necesarias si no existen (solo en desarrollo/local)
// En serverless (Vercel) esto no es necesario ya que los archivos se guardan en Supabase Storage
const ensureDirectories = () => {
  // Skip en entornos serverless
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return;
  }
  
  const directories = [
    'uploads', 
    'uploads/products'
  ];
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Carpeta creada automáticamente: ${dir}`);
    }
  });
};
ensureDirectories();

// Security: Configure Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: isDevelopment ? false : {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: !isDevelopment,
}));

// Security: Rate limiting - General limit for all routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // Limit each IP to 100 requests per windowMs in production
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Security: Stricter rate limiting for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 100 : 5, // Limit to 5 requests per windowMs in production
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Apply general rate limiting to all routes
app.use(generalLimiter);

// Security: CORS configuration
const allowedOrigins = isDevelopment
  ? ['http://localhost:5173', 'http://localhost:3000']
  : [
      ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
      // Allow Vercel deployment URL if present
      ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
      // Allow custom domain if configured
      ...(process.env.VERCEL ? [] : ['http://localhost:5173'])
    ];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || isDevelopment) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Swagger documentation
app.use('/api-docs', swaggerConfig.serve, swaggerConfig.setup);

// Apply stricter rate limiting to authentication routes
app.use('/users/login', authLimiter);
app.use('/users/register', authLimiter);
app.use('/users/reset-password-request', authLimiter);
app.use('/users/reset-password', authLimiter);

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

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
