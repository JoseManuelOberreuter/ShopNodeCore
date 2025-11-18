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
        Sistema completo de carrito de compras con gestión de usuarios, productos, carritos, órdenes y pagos con Transbank.
        
        Características principales:
        - 🔐 Autenticación JWT con roles de usuario y verificación obligatoria de correo
        - 📦 Gestión completa de productos
        - 🛒 Sistema de carrito de compras
        - 📋 Procesamiento de órdenes
        - 💳 Integración con Transbank Webpay Plus
        - 📊 Panel de administración
        - 📁 Subida de imágenes de productos
        
        Roles de usuario:
        - Usuario normal: Puede ver productos, gestionar su carrito, crear órdenes y procesar pagos
        - Administrador: Todas las funciones de usuario + gestión de productos, órdenes y anulaciones
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
        name: 'Payments',
        description: 'Procesamiento de pagos con Transbank Webpay Plus'
      },
      {
        name: 'Admin',
        description: 'Funciones administrativas (solo administradores)'
      },
      {
        name: 'Development',
        description: 'Endpoints de desarrollo y testing'
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
        },
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único de la orden'
            },
            user_id: {
              type: 'string',
              description: 'ID del usuario que realizó la orden'
            },
            order_number: {
              type: 'string',
              description: 'Número único de la orden'
            },
            total_amount: {
              type: 'number',
              format: 'float',
              description: 'Monto total de la orden'
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
              description: 'Estado de la orden'
            },
            payment_method: {
              type: 'string',
              enum: ['webpay', 'cash_on_delivery'],
              description: 'Método de pago'
            },
            payment_status: {
              type: 'string',
              enum: ['pending', 'paid', 'failed', 'refunded'],
              description: 'Estado del pago'
            },
            transbank_token: {
              type: 'string',
              description: 'Token de la transacción de Transbank'
            },
            transbank_status: {
              type: 'string',
              description: 'Estado de la transacción en Transbank'
            },
            shipping_street: {
              type: 'string',
              description: 'Dirección de envío'
            },
            shipping_city: {
              type: 'string',
              description: 'Ciudad de envío'
            },
            shipping_state: {
              type: 'string',
              description: 'Estado/región de envío'
            },
            shipping_zip_code: {
              type: 'string',
              description: 'Código postal de envío'
            },
            shipping_country: {
              type: 'string',
              description: 'País de envío'
            },
            notes: {
              type: 'string',
              description: 'Notas adicionales de la orden'
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
        },
        ShippingAddress: {
          type: 'object',
          required: ['street', 'city', 'state', 'zipCode', 'country'],
          properties: {
            street: {
              type: 'string',
              description: 'Dirección de la calle',
              example: 'Av. Principal 123'
            },
            city: {
              type: 'string',
              description: 'Ciudad',
              example: 'Santiago'
            },
            state: {
              type: 'string',
              description: 'Estado o región',
              example: 'Metropolitana'
            },
            zipCode: {
              type: 'string',
              description: 'Código postal',
              example: '7500000'
            },
            country: {
              type: 'string',
              description: 'País',
              example: 'Chile'
            }
          }
        },
        OrderItem: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID del item de la orden'
            },
            product_id: {
              type: 'string',
              description: 'ID del producto'
            },
            product_name: {
              type: 'string',
              description: 'Nombre del producto'
            },
            quantity: {
              type: 'integer',
              description: 'Cantidad del producto'
            },
            price: {
              type: 'number',
              format: 'float',
              description: 'Precio unitario del producto'
            },
            subtotal: {
              type: 'number',
              format: 'float',
              description: 'Subtotal del item (precio × cantidad)'
            }
          }
        },
        PaginationInfo: {
          type: 'object',
          properties: {
            currentPage: {
              type: 'integer',
              description: 'Página actual'
            },
            totalPages: {
              type: 'integer',
              description: 'Total de páginas'
            },
            totalOrders: {
              type: 'integer',
              description: 'Total de órdenes'
            },
            hasNextPage: {
              type: 'boolean',
              description: 'Si hay página siguiente'
            },
            hasPrevPage: {
              type: 'boolean',
              description: 'Si hay página anterior'
            }
          }
        },
        Cart: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único del carrito'
            },
            user_id: {
              type: 'string',
              description: 'ID del usuario propietario del carrito'
            },
            cart_items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    description: 'ID del item del carrito'
                  },
                  product_id: {
                    type: 'string',
                    description: 'ID del producto'
                  },
                  quantity: {
                    type: 'integer',
                    description: 'Cantidad del producto'
                  },
                  price: {
                    type: 'number',
                    format: 'float',
                    description: 'Precio del producto'
                  },
                  products: {
                    type: 'object',
                    description: 'Información del producto'
                  }
                }
              }
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
      },
      responses: {
        UnauthorizedError: {
          description: 'Token de acceso requerido o inválido',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'string',
                    example: 'Acceso denegado. No hay token.'
                  }
                }
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Acceso denegado - Se requieren permisos de administrador',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'string',
                    example: 'Acceso denegado. Se requieren permisos de administrador.'
                  }
                }
              }
            }
          }
        },
        VerificationRequiredError: {
          description: 'La cuenta debe estar verificada para acceder a este recurso',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  error: {
                    type: 'string',
                    example: 'Debes verificar tu cuenta antes de acceder a este recurso.'
                  },
                  code: {
                    type: 'string',
                    example: 'VERIFICATION_REQUIRED'
                  }
                }
              }
            }
          }
        },
        NotFoundError: {
          description: 'Recurso no encontrado',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  message: {
                    type: 'string',
                    example: 'Recurso no encontrado'
                  }
                }
              }
            }
          }
        },
        ValidationError: {
          description: 'Error de validación en los datos enviados',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  message: {
                    type: 'string',
                    example: 'Datos inválidos'
                  }
                }
              }
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