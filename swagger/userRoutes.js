/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         _id:
 *           type: string
 *           description: ID único del usuario
 *         name:
 *           type: string
 *           description: Nombre del usuario
 *         email:
 *           type: string
 *           format: email
 *           description: Correo electrónico del usuario
 *         password:
 *           type: string
 *           format: password
 *           description: Contraseña encriptada
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           default: user
 *           description: Rol del usuario en el sistema
 *         isVerified:
 *           type: boolean
 *           description: Estado de verificación del usuario
 *         verificationToken:
 *           type: string
 *           description: Token para verificación de cuenta
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de registro
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *
 *     UserRegisterRequest:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre completo del usuario
 *           example: "Juan Pérez"
 *         email:
 *           type: string
 *           format: email
 *           description: Correo electrónico único
 *           example: "juan@example.com"
 *         password:
 *           type: string
 *           format: password
 *           description: Contraseña (mínimo 8 caracteres, mayúsculas, minúsculas y números)
 *           example: "Password123!"
 *
 *     UserLoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "juan@example.com"
 *         password:
 *           type: string
 *           format: password
 *           example: "Password123!"
 *
 *     LoginResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Login exitoso"
 *         token:
 *           type: string
 *           description: JWT token para autenticación
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         user:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *             email:
 *               type: string
 *             role:
 *               type: string
 *               enum: [user, admin]
 *             isVerified:
 *               type: boolean
 */

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     description: Crea una nueva cuenta de usuario con rol de usuario normal por defecto
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegisterRequest'
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Usuario registrado exitosamente"
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                       example: "user"
 *                     isVerified:
 *                       type: boolean
 *                       example: false
 *       400:
 *         description: Error en los datos proporcionados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "La contraseña debe contener al menos una letra mayúscula."
 *       500:
 *         description: Error del servidor
 * 
 * /users/login:
 *   post:
 *     summary: Iniciar sesión
 *     description: Autentica un usuario y devuelve un token JWT
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLoginRequest'
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Credenciales inválidas o cuenta no verificada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Por favor verifica tu cuenta primero"
 *       500:
 *         description: Error del servidor
 * 
 * /users/verify/{token}:
 *   get:
 *     summary: Verificar cuenta de usuario
 *     description: Verifica la cuenta de usuario usando el token enviado por email
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de verificación enviado por email
 *     responses:
 *       200:
 *         description: Cuenta verificada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cuenta verificada exitosamente"
 *       400:
 *         description: Token inválido o expirado
 *       500:
 *         description: Error del servidor
 * 
 * /users/reset-password-request:
 *   post:
 *     summary: Solicitar recuperación de contraseña
 *     description: Envía un email con token para recuperar contraseña
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "juan@example.com"
 *     responses:
 *       200:
 *         description: Correo de recuperación enviado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Correo de recuperación enviado"
 *       400:
 *         description: Email no encontrado
 *       500:
 *         description: Error del servidor
 * 
 * /users/reset-password/{token}:
 *   post:
 *     summary: Restablecer contraseña
 *     description: Restablece la contraseña usando el token de recuperación
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de recuperación recibido por email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Nueva contraseña
 *                 example: "NewPassword123!"
 *     responses:
 *       200:
 *         description: Contraseña restablecida exitosamente
 *       400:
 *         description: Token inválido o expirado
 *       500:
 *         description: Error del servidor
 * 
 * /users/profile:
 *   get:
 *     summary: Obtener perfil del usuario
 *     description: Obtiene la información del perfil del usuario autenticado
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [user, admin]
 *                     isVerified:
 *                       type: boolean
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Error del servidor
 * 
 *   put:
 *     summary: Actualizar perfil del usuario
 *     description: Actualiza la información del perfil del usuario
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nuevo nombre del usuario
 *                 example: "Juan Carlos Pérez"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Nuevo email del usuario
 *                 example: "juan.carlos@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Nueva contraseña (opcional)
 *                 example: "NewPassword123!"
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
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
 *                   example: "Perfil actualizado exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       400:
 *         description: Datos inválidos
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Error del servidor
 */ 