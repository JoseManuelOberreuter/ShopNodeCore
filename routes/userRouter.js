const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/avatarMiddleware');
const { registerUser, loginUser, updateUser, verifyUser, requestPasswordReset, resetPassword, getUserData, uploadAvatar} = require('../controllers/userController');
const router = express.Router();

// Ruta para registrar un usuario
router.post('/register', registerUser);

// Ruta para iniciar sesión
router.post('/login', loginUser);

// Ruta para verificar la cuenta con el token
router.get('/verify/:token', verifyUser);

// Ruta para solicitar cambio de contraseña
router.post('/reset-password-request', requestPasswordReset);

// Ruta para cambiar la contraseña con el token
router.post('/reset-password/:token', resetPassword);

// Ruta para traer los datos del usuario por ID o email
router.get('/profile/:identifier', authMiddleware, getUserData);

// Ruta para subir la foto de perfil 
router.post('/upload-avatar', authMiddleware, upload.single('avatar'), uploadAvatar);

module.exports = router;
