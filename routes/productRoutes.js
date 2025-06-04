const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  updateStock,
  upload
} = require('../controllers/productController');

// Importar middlewares
const auth = require('../middlewares/auth');
const authAdmin = require('../middlewares/authAdmin');

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Gestión de productos
 */

// 🔓 RUTAS PÚBLICAS

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Obtener todos los productos
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 */
router.get('/', getAllProducts);

/**
 * @swagger
 * /api/products/categories:
 *   get:
 *     summary: Obtener todas las categorías
 *     tags: [Products]
 */
router.get('/categories', getCategories);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Obtener producto por ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:id', getProductById);

// 🔒 RUTAS PRIVADAS (Solo Admin)

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Crear nuevo producto (Solo Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               category:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 */
router.post('/', auth, authAdmin, upload.single('image'), createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Actualizar producto (Solo Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.put('/:id', auth, authAdmin, upload.single('image'), updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Eliminar producto (Solo Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.delete('/:id', auth, authAdmin, deleteProduct);

/**
 * @swagger
 * /api/products/{id}/stock:
 *   patch:
 *     summary: Actualizar stock del producto (Solo Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.patch('/:id/stock', auth, authAdmin, updateStock);

module.exports = router; 