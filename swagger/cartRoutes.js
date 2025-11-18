/**
 * @swagger
 * components:
 *   schemas:
 *     AddToCartRequest:
 *       type: object
 *       required:
 *         - productId
 *       properties:
 *         productId:
 *           type: string
 *           description: ID del producto a agregar
 *           example: "507f1f77bcf86cd799439011"
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           description: Cantidad a agregar al carrito
 *           example: 2
 *
 *     UpdateCartRequest:
 *       type: object
 *       required:
 *         - productId
 *         - quantity
 *       properties:
 *         productId:
 *           type: string
 *           description: ID del producto a actualizar
 *           example: "507f1f77bcf86cd799439011"
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: Nueva cantidad del producto
 *           example: 3
 *
 *     CartResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           $ref: '#/components/schemas/Cart'
 *         totalItems:
 *           type: integer
 *           description: Número total de items en el carrito
 *           example: 5
 *
 *     CartSummary:
 *       type: object
 *       properties:
 *         totalItems:
 *           type: integer
 *           description: Cantidad total de productos
 *           example: 5
 *         totalAmount:
 *           type: number
 *           format: float
 *           description: Monto total del carrito
 *           example: 1599.98
 *         itemCount:
 *           type: integer
 *           description: Número de tipos de productos diferentes
 *           example: 2
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               productName:
 *                 type: string
 *               price:
 *                 type: number
 *               quantity:
 *                 type: integer
 *               subtotal:
 *                 type: number
 */

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Obtener carrito del usuario
 *     description: Obtiene el carrito de compras del usuario autenticado
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Carrito obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CartResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/VerificationRequiredError'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */

/**
 * @swagger
 * /api/cart/summary:
 *   get:
 *     summary: Obtener resumen del carrito
 *     description: Obtiene un resumen condensado del carrito con totales e información básica
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resumen del carrito obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CartSummary'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/VerificationRequiredError'
 */

/**
 * @swagger
 * /api/cart/add:
 *   post:
 *     summary: Agregar producto al carrito
 *     description: Agrega un producto al carrito o incrementa la cantidad si ya existe
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddToCartRequest'
 *     responses:
 *       200:
 *         description: Producto agregado al carrito exitosamente
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
 *                   example: "Producto agregado al carrito exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 *                 totalItems:
 *                   type: integer
 *                   example: 3
 *       400:
 *         description: Error de validación o stock insuficiente
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
 *                   example: "Solo hay 5 unidades disponibles"
 *       404:
 *         description: Producto no encontrado
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
 *                   example: "Producto no encontrado o no disponible"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/VerificationRequiredError'
 */

/**
 * @swagger
 * /api/cart/update:
 *   put:
 *     summary: Actualizar cantidad de producto en carrito
 *     description: Actualiza la cantidad de un producto específico en el carrito
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCartRequest'
 *     responses:
 *       200:
 *         description: Carrito actualizado exitosamente
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
 *                   example: "Carrito actualizado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 *                 totalItems:
 *                   type: integer
 *                   example: 4
 *       400:
 *         description: Error de validación o stock insuficiente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Producto no encontrado en el carrito
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
 *                   example: "Producto no encontrado en el carrito"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/VerificationRequiredError'
 */

/**
 * @swagger
 * /api/cart/remove/{productId}:
 *   delete:
 *     summary: Eliminar producto del carrito
 *     description: Elimina completamente un producto del carrito
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del producto a eliminar
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Producto eliminado del carrito exitosamente
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
 *                   example: "Producto eliminado del carrito exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 *                 totalItems:
 *                   type: integer
 *                   example: 2
 *       404:
 *         description: Carrito no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/VerificationRequiredError'
 */

/**
 * @swagger
 * /api/cart/clear:
 *   delete:
 *     summary: Limpiar carrito completo
 *     description: Elimina todos los productos del carrito de compras
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Carrito limpiado exitosamente
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
 *                   example: "Carrito limpiado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Cart'
 *                 totalItems:
 *                   type: integer
 *                   example: 0
 *       404:
 *         description: Carrito no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/VerificationRequiredError'
 */ 