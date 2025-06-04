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
 *         paymentMethod:
 *           type: string
 *           enum: [credit_card, debit_card, paypal, cash_on_delivery]
 *           default: cash_on_delivery
 *           description: Método de pago preferido
 *           example: "cash_on_delivery"
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
 *             ordersByStatus:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     description: Estado de la orden
 *                   count:
 *                     type: integer
 *                     description: Número de órdenes en este estado
 *                   totalAmount:
 *                     type: number
 *                     description: Monto total de órdenes en este estado
 *             totalOrders:
 *               type: integer
 *               description: Total de órdenes
 *             totalRevenue:
 *               type: number
 *               description: Ingresos totales
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
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio para filtrar (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin para filtrar (YYYY-MM-DD)
 *         example: "2024-12-31"
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, totalAmount, status]
 *           default: createdAt
 *         description: Campo para ordenar
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Orden ascendente o descendente
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
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de inicio para el período de estadísticas
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Fecha de fin para el período de estadísticas
 *         example: "2024-12-31"
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