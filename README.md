# 🛒 Sistema de Carrito de Compras - API REST

Un sistema completo de carrito de compras con gestión de usuarios, productos, carritos y órdenes. Enfocado exclusivamente en e-commerce con autenticación JWT, roles de usuario, gestión de stock y panel de administración.

## 🚀 Características

- ✅ **Gestión de Usuarios**: Registro, login, verificación por email, perfiles
- ✅ **Roles de Usuario**: Usuario normal y Administrador
- ✅ **Catálogo de Productos**: CRUD completo con imágenes
- ✅ **Carrito de Compras**: Agregar, actualizar, eliminar productos
- ✅ **Sistema de Órdenes**: Crear órdenes desde el carrito
- ✅ **Gestión de Stock**: Actualización automática al realizar compras
- ✅ **Panel de Administración**: Gestión de productos, órdenes y estadísticas
- ✅ **Documentación Swagger**: API completamente documentada
- ✅ **Subida de Imágenes**: Imágenes de productos

## 📋 Requisitos Previos

- Node.js (v14 o superior)
- MongoDB
- npm o yarn

## 🛠️ Instalación

1. **Clonar el repositorio**
```bash
git clone <url-del-repositorio>
cd CarritoCompras
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
Crear archivo `.env` en la raíz del proyecto basándose en `.env.example`:
```env
# Base de datos (Supabase)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu_supabase_key

# JWT
JWT_SECRET=tu_jwt_secret_muy_seguro

# Servidor
PORT=4005
NODE_ENV=development

# Frontend URL (para emails y redirects)
FRONTEND_URL=http://localhost:5173

# CORS (URLs permitidas separadas por comas - solo en producción)
ALLOWED_ORIGINS=http://localhost:5173,https://tu-frontend.vercel.app

# Transbank (opcional)
TRANSBANK_API_KEY=tu_api_key
TRANSBANK_ENVIRONMENT=integration
TRANSBANK_COMMERCE_CODE=tu_commerce_code

# Email (opcional)
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_password_de_aplicacion
```

**Nota importante para despliegues:**
- Para cada nuevo despliegue con un nombre diferente, asegúrate de actualizar:
  - `SUPABASE_URL` y `SUPABASE_KEY` si usas una base de datos diferente
  - `FRONTEND_URL` con la URL de tu frontend desplegado
  - `ALLOWED_ORIGINS` con todas las URLs del frontend permitidas (separadas por comas)

4. **Poblar base de datos con productos de prueba**
```bash
npm run seed:products
```

5. **Iniciar el servidor**
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 📚 Documentación de la API

Una vez iniciado el servidor, accede a la documentación Swagger en:
```
http://localhost:4005/api-docs
```

## 🔗 Endpoints Principales

### 👤 Autenticación
- `POST /users/register` - Registrar usuario
- `POST /users/login` - Iniciar sesión
- `GET /users/verify/{token}` - Verificar cuenta
- `GET /users/profile` - Obtener perfil
- `PUT /users/profile` - Actualizar perfil
- `POST /users/reset-password-request` - Solicitar reset de contraseña
- `POST /users/reset-password/{token}` - Restablecer contraseña

### 📦 Productos (Público)
- `GET /api/products` - Listar productos
- `GET /api/products/:id` - Obtener producto por ID
- `GET /api/products/categories` - Obtener categorías

### 📦 Productos (Solo Admin)
- `POST /api/products` - Crear producto
- `PUT /api/products/:id` - Actualizar producto
- `DELETE /api/products/:id` - Eliminar producto
- `PATCH /api/products/:id/stock` - Actualizar stock

### 🛒 Carrito (Usuarios autenticados)
- `GET /api/cart` - Obtener carrito
- `GET /api/cart/summary` - Resumen del carrito
- `POST /api/cart/add` - Agregar producto
- `PUT /api/cart/update` - Actualizar cantidad
- `DELETE /api/cart/remove/:productId` - Eliminar producto
- `DELETE /api/cart/clear` - Limpiar carrito

### 📋 Órdenes (Usuarios)
- `POST /api/orders` - Crear orden
- `GET /api/orders/my-orders` - Mis órdenes
- `GET /api/orders/:orderId` - Obtener orden
- `PATCH /api/orders/:orderId/cancel` - Cancelar orden

### 📋 Órdenes (Admin)
- `GET /api/orders/admin/all` - Todas las órdenes
- `GET /api/orders/admin/stats` - Estadísticas
- `PATCH /api/orders/admin/:orderId/status` - Actualizar estado

## 🔐 Autenticación

El sistema utiliza JWT (JSON Web Tokens) para la autenticación. Incluye el token en el header:

```
Authorization: Bearer <tu_jwt_token>
```

## 👥 Roles de Usuario

### Usuario Normal (`user`)
- Ver productos y categorías
- Gestionar su carrito personal
- Crear y ver sus órdenes
- Cancelar órdenes pendientes
- Gestionar su perfil

### Administrador (`admin`)
- Todas las funciones de usuario normal
- Gestionar productos (CRUD)
- Ver todas las órdenes del sistema
- Actualizar estado de órdenes
- Ver estadísticas del sistema
- Gestionar stock de productos

## 📁 Estructura del Proyecto

```
CarritoCompras/
├── controllers/          # Lógica de negocio
│   ├── userController.js
│   ├── productController.js
│   ├── cartController.js
│   └── orderController.js
├── models/              # Modelos de MongoDB
│   ├── userModel.js
│   ├── productModel.js
│   ├── cartModel.js
│   └── orderModel.js
├── routes/              # Definición de rutas
│   ├── userRouter.js
│   ├── productRoutes.js
│   ├── cartRoutes.js
│   └── orderRoutes.js
├── middlewares/         # Middlewares personalizados
│   ├── auth.js
│   ├── authAdmin.js
│   └── authMiddleware.js
├── utils/               # Utilidades
│   ├── seedProducts.js
│   └── testSystem.js
├── uploads/             # Archivos subidos
│   └── products/        # Imágenes de productos
└── swagger/             # Documentación API
    ├── swagger.js
    ├── productRoutes.js
    ├── cartRoutes.js
    ├── orderRoutes.js
    └── userRoutes.js
```

## 🧪 Ejemplos de Uso

### 1. Registrar Usuario
```bash
curl -X POST http://localhost:4005/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "password": "Password123!"
  }'
```

### 2. Agregar Producto al Carrito
```bash
curl -X POST http://localhost:4005/api/cart/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu_token>" \
  -d '{
    "productId": "product_id_aqui",
    "quantity": 2
  }'
```

### 3. Crear Orden
```bash
curl -X POST http://localhost:4005/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu_token>" \
  -d '{
    "shippingAddress": {
      "street": "Calle Principal 123",
      "city": "Ciudad",
      "state": "Estado",
      "zipCode": "12345",
      "country": "País"
    },
    "paymentMethod": "cash_on_delivery"
  }'
```

## 🔧 Scripts Disponibles

- `npm start` - Iniciar servidor en producción
- `npm run dev` - Iniciar servidor en desarrollo
- `npm run seed:products` - Poblar BD con productos de prueba
- `npm run test:system` - Ejecutar pruebas del sistema
- `npm test` - Ejecutar tests
- `npm run lint` - Verificar código con ESLint

## 🚀 Despliegue

### Variables de Entorno para Producción
```env
NODE_ENV=production
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/carrito_compras
JWT_SECRET=jwt_secret_super_seguro_para_produccion
PORT=4005
```

## ✨ Funcionalidades Destacadas

### 🔒 Seguridad
- Autenticación JWT robusta
- Verificación de email
- Roles y permisos granulares
- Validación de datos completa

### 🛒 Carrito Inteligente
- Validación automática de stock
- Cálculo de totales en tiempo real
- Persistencia por usuario
- Limpieza automática al comprar

### 📦 Gestión de Productos
- Categorización automática
- Subida de imágenes
- Control de stock en tiempo real
- Soft delete para mantener historial

### 📋 Sistema de Órdenes
- Transacciones MongoDB
- Estados de orden configurables
- Restauración de stock en cancelaciones
- Tracking completo

### 📊 Panel Administrativo
- Estadísticas en tiempo real
- Gestión completa de órdenes
- Control de inventario
- Reportes de ventas

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia ISC.

## 👨‍💻 Autor

**jmo** - Desarrollador Principal

---

¡Gracias por usar nuestro Sistema de Carrito de Compras! 🛒✨