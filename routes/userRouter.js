import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import authAdmin from '../middlewares/authAdmin.js';
import upload from '../middlewares/avatarMiddleware.js';
import { 
  registerUser, 
  loginUser, 
  updateUser, 
  updateProfile, 
  verifyUser, 
  resendVerificationEmail,
  requestPasswordReset, 
  resetPassword, 
  getUserData, 
  uploadAvatar,
  getAllUsers
} from '../controllers/userController.js';

const router = express.Router();

// Ruta para registrar un usuario
router.post('/register', registerUser);

// Ruta para iniciar sesión
router.post('/login', loginUser);

// Ruta para verificar la cuenta con el token
router.get('/verify/:token', verifyUser);

// Ruta para reenviar correo de verificación
router.post('/resend-verification', resendVerificationEmail);

// Ruta para solicitar cambio de contraseña
router.post('/reset-password-request', requestPasswordReset);

// Ruta para cambiar la contraseña con el token
router.post('/reset-password/:token', resetPassword);

// Ruta para actualizar el perfil del usuario autenticado
router.put('/profile', authMiddleware, updateProfile);

// Ruta para traer los datos del usuario por ID o email
router.get('/profile/:identifier', authMiddleware, getUserData);

// Ruta para subir la foto de perfil 
router.post('/upload-avatar', authMiddleware, upload.single('avatar'), uploadAvatar);

// Ruta para obtener todos los usuarios (Solo para administradores)
router.get('/all', authMiddleware, authAdmin, getAllUsers);

export default router;
