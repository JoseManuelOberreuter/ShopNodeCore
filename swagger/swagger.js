import dotenv from 'dotenv';
dotenv.config();

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sistema de Carrito de Compras - API REST',
      version: '2.0.0',
      description: `
        Sistema completo de carrito de compras con gestión de usuarios, productos, carritos y órdenes.
        
        Características principales:
        - 🔐 Autenticación JWT con roles de usuario
        - 📦 Gestión completa de productos
        - 🛒 Sistema de carrito de compras
        - 📋 Procesamiento de órdenes
        - 📊 Panel de administración
        - 📁 Subida de imágenes de productos
        
        Roles de usuario:
        - Usuario normal: Puede ver productos, gestionar su carrito y crear órdenes
        - Administrador: Todas las funciones de usuario + gestión de productos y órdenes
      `,
      contact: {
        name: 'Sistema de Carrito de Compras',
        email: 'admin@carritocompras.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 4005}`,
        description: 'Servidor de desarrollo',
      },
      {
        url: 'https://api.carritocompras.com',
        description: 'Servidor de producción'
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Operaciones de autenticación y gestión de usuarios'
      },
      {
        name: 'Products',
        description: 'Gestión del catálogo de productos'
      },
      {
        name: 'Cart',
        description: 'Operaciones del carrito de compras'
      },
      {
        name: 'Orders',
        description: 'Gestión de órdenes y compras'
      },
      {
        name: 'Admin',
        description: 'Funciones administrativas (solo administradores)'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingresa tu token JWT en el formato: Bearer {token}'
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único del usuario'
            },
            name: {
              type: 'string',
              description: 'Nombre completo del usuario'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email del usuario'
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              description: 'Rol del usuario'
            },
            is_verified: {
              type: 'boolean',
              description: 'Estado de verificación del usuario'
            },
            avatar: {
              type: 'string',
              description: 'URL del avatar del usuario'
            }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único del producto'
            },
            name: {
              type: 'string',
              description: 'Nombre del producto'
            },
            description: {
              type: 'string',
              description: 'Descripción detallada del producto'
            },
            price: {
              type: 'number',
              format: 'float',
              description: 'Precio del producto'
            },
            stock: {
              type: 'integer',
              description: 'Cantidad disponible en inventario'
            },
            image: {
              type: 'string',
              description: 'URL de la imagen del producto'
            },
            category: {
              type: 'string',
              description: 'Categoría del producto'
            },
            is_active: {
              type: 'boolean',
              description: 'Estado activo del producto'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de última actualización'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './routes/*.js',
    './swagger/*.js'
  ]
};

const specs = swaggerJsdoc(options);

const swaggerConfig = {
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Carrito de Compras API',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'none',
      filter: true,
      showRequestHeaders: true,
      supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
      tryItOutEnabled: true,
    },
  })
};

export default swaggerConfig; 