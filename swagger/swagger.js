const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

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
        url: 'http://localhost:4005',
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
            _id: {
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
            isVerified: {
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
            _id: {
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
            isActive: {
              type: 'boolean',
              description: 'Estado activo del producto'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de última actualización'
            }
          }
        },
        CartItem: {
          type: 'object',
          properties: {
            product: {
              $ref: '#/components/schemas/Product'
            },
            quantity: {
              type: 'integer',
              minimum: 1,
              description: 'Cantidad del producto en el carrito'
            },
            price: {
              type: 'number',
              format: 'float',
              description: 'Precio unitario del producto'
            }
          }
        },
        Cart: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID único del carrito'
            },
            user: {
              type: 'string',
              description: 'ID del usuario propietario'
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/CartItem'
              },
              description: 'Lista de productos en el carrito'
            },
            totalAmount: {
              type: 'number',
              format: 'float',
              description: 'Monto total del carrito'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        OrderItem: {
          type: 'object',
          properties: {
            product: {
              type: 'string',
              description: 'ID del producto'
            },
            productName: {
              type: 'string',
              description: 'Nombre del producto al momento de la compra'
            },
            quantity: {
              type: 'integer',
              description: 'Cantidad comprada'
            },
            price: {
              type: 'number',
              format: 'float',
              description: 'Precio unitario al momento de la compra'
            },
            subtotal: {
              type: 'number',
              format: 'float',
              description: 'Subtotal del item'
            }
          }
        },
        ShippingAddress: {
          type: 'object',
          required: ['street', 'city'],
          properties: {
            street: {
              type: 'string',
              description: 'Dirección de la calle'
            },
            city: {
              type: 'string',
              description: 'Ciudad'
            },
            state: {
              type: 'string',
              description: 'Estado o provincia'
            },
            zipCode: {
              type: 'string',
              description: 'Código postal'
            },
            country: {
              type: 'string',
              description: 'País'
            }
          }
        },
        Order: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID único de la orden'
            },
            user: {
              $ref: '#/components/schemas/User'
            },
            orderNumber: {
              type: 'string',
              description: 'Número único de la orden'
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/OrderItem'
              }
            },
            totalAmount: {
              type: 'number',
              format: 'float',
              description: 'Monto total de la orden'
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
              description: 'Estado de la orden'
            },
            shippingAddress: {
              $ref: '#/components/schemas/ShippingAddress'
            },
            paymentMethod: {
              type: 'string',
              enum: ['credit_card', 'debit_card', 'paypal', 'cash_on_delivery'],
              description: 'Método de pago'
            },
            paymentStatus: {
              type: 'string',
              enum: ['pending', 'paid', 'failed', 'refunded'],
              description: 'Estado del pago'
            },
            notes: {
              type: 'string',
              description: 'Notas adicionales'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indica si la operación fue exitosa'
            },
            message: {
              type: 'string',
              description: 'Mensaje descriptivo de la respuesta'
            },
            data: {
              type: 'object',
              description: 'Datos de respuesta'
            },
            error: {
              type: 'string',
              description: 'Mensaje de error (si aplica)'
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
            totalItems: {
              type: 'integer',
              description: 'Total de elementos'
            },
            itemsPerPage: {
              type: 'integer',
              description: 'Elementos por página'
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Token de acceso faltante o inválido',
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
          description: 'Acceso denegado por permisos insuficientes',
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
                    example: 'Acceso denegado. Se requieren permisos de administrador'
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
          description: 'Error de validación de datos',
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
                    example: 'Datos de entrada inválidos'
                  },
                  error: {
                    type: 'string'
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
  apis: ['./routes/*.js', './swagger/*.js'], // Path to the API routes and swagger documentation
};

const specs = swaggerJsdoc(options);

module.exports = {
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(specs, {
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #e8491d }
    `,
    customSiteTitle: "🛒 API Carrito de Compras"
  }),
}; 