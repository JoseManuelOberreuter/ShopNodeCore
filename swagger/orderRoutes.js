/**
 * @swagger
 * components:
 *   schemas:
 *     CreateOrderRequest:
 *       type: object
 *       required:
 *         - shippingAddress
 *       properties:
 *         shippingAddress:
 *           $ref: '#/components/schemas/ShippingAddress'
 *         notes:
 *           type: string
 *           description: Notas adicionales para la orden
 *           example: "Entregar en horario de oficina"
 *
 *     OrdersResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Order'
 *         pagination:
 *           $ref: '#/components/schemas/PaginationInfo'
 *
 *     OrderStatsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             period:
 *               type: string
 *               example: "30d"
 *             summary:
 *               type: object
 *               properties:
 *                 totalOrders:
 *                   type: integer
 *                   description: Total de órdenes
 *                 totalRevenue:
 *                   type: number
 *                   description: Ingresos totales
 *                 averageOrderValue:
 *                   type: number
 *                   description: Valor promedio de orden
 *                 conversionRate:
 *                   type: number
 *                   description: Tasa de conversión de pago
 *             ordersByStatus:
 *               type: object
 *               additionalProperties:
 *                 type: integer
 *               description: Conteo de órdenes por estado
 *             ordersByPaymentStatus:
 *               type: object
 *               additionalProperties:
 *                 type: integer
 *               description: Conteo de órdenes por estado de pago
 *             dateRange:
 *               type: object
 *               properties:
 *                 start:
 *                   type: string
 *                   format: date-time
 *                 end:
 *                   type: string
 *                   format: date-time
 *
 *     UpdateOrderStatusRequest:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [pending, confirmed, processing, shipped, delivered, cancelled]
 *           description: Nuevo estado de la orden
 *           example: "confirmed"
 *         notes:
 *           type: string
 *           description: Notas adicionales sobre el cambio de estado
 *           example: "Orden confirmada y en preparación"
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Crear nueva orden desde carrito
 *     description: Crea una nueva orden de compra usando los productos del carrito del usuario
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderRequest'
 *     responses:
 *       201:
 *         description: Orden creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Orden creada exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Error de validación o carrito vacío
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "El carrito está vacío"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/VerificationRequiredError'
 */

/**
 * @swagger
 * /api/orders/test:
 *   post:
 *     summary: Crear orden de prueba para desarrollo
 *     description: Crea una orden de prueba usando productos existentes para desarrollo y testing
 *     tags: [Orders, Development]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Orden de prueba creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Orden de prueba creada exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     orderId:
 *                       type: string
 *                       example: "123e4567-e89b-12d3-a456-426614174000"
 *                     orderNumber:
 *                       type: string
 *                       example: "ORD-1703123456789-ABC12"
 *                     totalAmount:
 *                       type: number
 *                       example: 1599.98
 *                     status:
 *                       type: string
 *                       example: "confirmed"
 *                     paymentStatus:
 *                       type: string
 *                       example: "paid"
 *                     itemsCount:
 *                       type: integer
 *                       example: 3
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: No hay productos disponibles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "No hay productos disponibles para crear una orden de prueba"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/VerificationRequiredError'
 */

/**
 * @swagger
 * /api/orders/my-orders:
 *   get:
 *     summary: Obtener órdenes del usuario
 *     description: Obtiene todas las órdenes del usuario autenticado
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Órdenes por página
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, processing, shipped, delivered, cancelled]
 *         description: Filtrar por estado de orden
 *     responses:
 *       200:
 *         description: Órdenes obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrdersResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/VerificationRequiredError'
 */

/**
 * @swagger
 * /api/orders/{orderId}:
 *   get:
 *     summary: Obtener orden por ID
 *     description: Obtiene los detalles de una orden específica del usuario
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la orden
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Orden obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/VerificationRequiredError'
 */

/**
 * @swagger
 * /api/orders/{orderId}/cancel:
 *   patch:
 *     summary: Cancelar orden
 *     description: Cancela una orden si está en estado pendiente y restaura el stock
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la orden a cancelar
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Orden cancelada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Orden cancelada exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Solo se pueden cancelar órdenes pendientes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Solo se pueden cancelar órdenes pendientes"
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/VerificationRequiredError'
 */

/**
 * @swagger
 * /api/orders/admin/all:
 *   get:
 *     summary: Obtener todas las órdenes (Solo Admin)
 *     description: Obtiene todas las órdenes del sistema con filtros y paginación
 *     tags: [Orders, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Órdenes por página
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, processing, shipped, delivered, cancelled]
 *         description: Filtrar por estado
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *           enum: [pending, paid, failed, refunded]
 *         description: Filtrar por estado de pago
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filtrar por ID de usuario específico
 *     responses:
 *       200:
 *         description: Órdenes obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrdersResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/orders/admin/stats:
 *   get:
 *     summary: Obtener estadísticas de órdenes (Solo Admin)
 *     description: Obtiene estadísticas agregadas de órdenes y ventas
 *     tags: [Orders, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y]
 *           default: 30d
 *         description: Período de tiempo para las estadísticas
 *         example: "30d"
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrderStatsResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */

/**
 * @swagger
 * /api/orders/admin/{orderId}/status:
 *   patch:
 *     summary: Actualizar estado de orden (Solo Admin)
 *     description: Actualiza el estado de una orden específica
 *     tags: [Orders, Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la orden
 *         example: "507f1f77bcf86cd799439011"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateOrderStatusRequest'
 *     responses:
 *       200:
 *         description: Estado de orden actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Estado de orden actualizado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Estado de orden inválido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Estado de orden inválido"
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */ 