import express from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
  updateStock,
  getAllProductsAdmin,
  getFeaturedProducts,
  getOnSaleProducts,
  upload
} from '../controllers/productController.js';

// Importar middlewares
import auth from '../middlewares/auth.js';
import authAdmin from '../middlewares/authAdmin.js';

const router = express.Router();

// 🔓 RUTAS PÚBLICAS
router.get('/', getAllProducts);

router.get('/featured', getFeaturedProducts);

router.get('/offers', getOnSaleProducts);

router.get('/categories', getCategories);

router.get('/admin/all', auth, authAdmin, getAllProductsAdmin);

router.get('/:id', getProductById);

// 🔒 RUTAS PRIVADAS (Solo Admin)
router.post('/', auth, authAdmin, upload.single('image'), createProduct);

// Use upload.fields([]) to handle FormData with optional file
// This allows FormData to be parsed even without files
router.put('/:id', auth, authAdmin, upload.fields([{ name: 'image', maxCount: 1 }]), updateProduct);

router.delete('/:id', auth, authAdmin, deleteProduct);

router.patch('/:id/stock', auth, authAdmin, updateStock);

export default router; 