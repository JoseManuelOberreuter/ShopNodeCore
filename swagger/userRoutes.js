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
 * /users/resend-verification:
 *   post:
 *     summary: Reenviar correo de verificación
 *     description: Reenvía un nuevo correo de verificación a un usuario que aún no ha verificado su cuenta
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
 *                 description: Correo electrónico del usuario que solicita reenvío
 *                 example: "juan@example.com"
 *     responses:
 *       200:
 *         description: Correo de verificación reenviado exitosamente
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
 *                   example: "Correo de verificación reenviado exitosamente. Revisa tu bandeja de entrada."
 *       400:
 *         description: Email requerido o cuenta ya verificada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "La cuenta ya está verificada"
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Usuario no encontrado"
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
 * 
 * /users/profile/{identifier}:
 *   get:
 *     summary: Obtener perfil del usuario por ID o email
 *     description: Obtiene la información del perfil de un usuario específico usando su ID o email
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de MongoDB o dirección de email del usuario
 *     responses:
 *       200:
 *         description: Perfil obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *                   enum: [user, admin]
 *                 isVerified:
 *                   type: boolean
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error del servidor
 * 
 * /users/all:
 *   get:
 *     summary: Obtener todos los usuarios (Solo administradores)
 *     description: Obtiene la lista completa de todos los usuarios registrados en el sistema. Solo accesible para administradores.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida exitosamente
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
 *                   example: "Lista de usuarios obtenida exitosamente"
 *                 total:
 *                   type: integer
 *                   description: Número total de usuarios
 *                   example: 25
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         description: ID único del usuario
 *                       name:
 *                         type: string
 *                         description: Nombre del usuario
 *                       email:
 *                         type: string
 *                         format: email
 *                         description: Correo electrónico del usuario
 *                       role:
 *                         type: string
 *                         enum: [user, admin]
 *                         description: Rol del usuario
 *                       is_verified:
 *                         type: boolean
 *                         description: Estado de verificación
 *                       avatar:
 *                         type: string
 *                         description: URL del avatar del usuario
 *                       telefono:
 *                         type: string
 *                         description: Número de teléfono
 *                       fecha_nacimiento:
 *                         type: string
 *                         format: date
 *                         description: Fecha de nacimiento
 *                       direccion:
 *                         type: string
 *                         description: Dirección del usuario
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         description: Fecha de registro
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                         description: Fecha de última actualización
 *                       last_login:
 *                         type: string
 *                         format: date-time
 *                         description: Fecha del último inicio de sesión
 *                         nullable: true
 *       401:
 *         description: Token de autenticación requerido
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
 *                   example: "Token de autenticación requerido"
 *       403:
 *         description: Acceso denegado. Se requieren permisos de administrador
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
 *                   example: "Acceso denegado. Se requieren permisos de administrador"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Error interno del servidor al obtener los usuarios"
 * 
 * /users/{id}:
 *   get:
 *     summary: Obtener usuario por ID (Solo administradores)
 *     description: Obtiene la información completa de un usuario específico por su ID. Solo accesible para administradores.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID único del usuario
 *     responses:
 *       200:
 *         description: Usuario obtenido exitosamente
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
 *                   example: "Usuario obtenido exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: ID único del usuario
 *                     name:
 *                       type: string
 *                       description: Nombre del usuario
 *                     email:
 *                       type: string
 *                       format: email
 *                       description: Correo electrónico del usuario
 *                     role:
 *                       type: string
 *                       enum: [user, admin]
 *                       description: Rol del usuario
 *                     is_verified:
 *                       type: boolean
 *                       description: Estado de verificación
 *                     avatar:
 *                       type: string
 *                       description: URL del avatar del usuario
 *                     telefono:
 *                       type: string
 *                       description: Número de teléfono
 *                     fecha_nacimiento:
 *                       type: string
 *                       format: date
 *                       description: Fecha de nacimiento
 *                     direccion:
 *                       type: string
 *                       description: Dirección del usuario
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       description: Fecha de registro
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       description: Fecha de última actualización
 *                     last_login:
 *                       type: string
 *                       format: date-time
 *                       description: Fecha del último inicio de sesión
 *                       nullable: true
 *       400:
 *         description: ID de usuario requerido
 *       401:
 *         description: Token de autenticación requerido
 *       403:
 *         description: Acceso denegado. Se requieren permisos de administrador
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 * 
 *   put:
 *     summary: Actualizar usuario por ID (Solo administradores)
 *     description: Permite a un administrador actualizar cualquier campo de un usuario específico. Solo accesible para administradores.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID único del usuario a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre del usuario
 *                 example: "Juan Carlos Pérez"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Correo electrónico del usuario
 *                 example: "juan.carlos@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Nueva contraseña (se validará automáticamente)
 *                 example: "NewPassword123!"
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 description: Rol del usuario
 *                 example: "user"
 *               is_verified:
 *                 type: boolean
 *                 description: Estado de verificación de la cuenta
 *                 example: true
 *               telefono:
 *                 type: string
 *                 description: Número de teléfono
 *                 example: "+56912345678"
 *               fecha_nacimiento:
 *                 type: string
 *                 format: date
 *                 description: Fecha de nacimiento
 *                 example: "1990-01-15"
 *               direccion:
 *                 type: string
 *                 description: Dirección del usuario
 *                 example: "Av. Principal 123, Santiago"
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
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
 *                   example: "Usuario actualizado exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     is_verified:
 *                       type: boolean
 *                     telefono:
 *                       type: string
 *                     fecha_nacimiento:
 *                       type: string
 *                     direccion:
 *                       type: string
 *                     avatar:
 *                       type: string
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Datos inválidos o error en la validación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "El email ya está en uso por otro usuario"
 *       401:
 *         description: Token de autenticación requerido
 *       403:
 *         description: Acceso denegado. Se requieren permisos de administrador
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 * 
 *   delete:
 *     summary: Eliminar usuario por ID (Solo administradores - Soft Delete)
 *     description: Elimina un usuario del sistema usando soft delete (marca deleted_at). El usuario no se elimina físicamente pero queda excluido de todas las consultas normales. Solo accesible para administradores.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID único del usuario a eliminar
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente (soft delete)
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
 *                   example: "Usuario eliminado exitosamente"
 *       400:
 *         description: Error en la solicitud
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   examples:
 *                     usuarioYaEliminado:
 *                       value: "El usuario ya está eliminado"
 *                     noPuedeEliminarse:
 *                       value: "No puedes eliminar tu propia cuenta"
 *       401:
 *         description: Token de autenticación requerido
 *       403:
 *         description: Acceso denegado. Se requieren permisos de administrador
 *       404:
 *         description: Usuario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Usuario no encontrado"
 *       500:
 *         description: Error interno del servidor
 */ 