import { userService } from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/mailer.js';
import { validatePassword } from '../utils/passwordValidator.js';

// 📌 Registrar Usuario
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validar campos requeridos
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    // Validar la seguridad de la contraseña
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    // Verificar si el usuario ya existe
    const userExists = await userService.findByEmail(email);
    if (userExists) {
      return res.status(400).json({ error: "El usuario ya existe" });
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generar Token para verificación
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Crear usuario
    const newUser = await userService.create({
      name,
      email,
      password: hashedPassword,
      isVerified: false,
      verificationToken
    });

    // Enviar correo de verificación
    await sendVerificationEmail(email, verificationToken);

    // Devolver respuesta exitosa
    res.status(201).json({
      message: "Usuario registrado exitosamente",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        is_verified: newUser.is_verified
      }
    });
  } catch (error) {
    console.error("Error en registerUser:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// 📌 Reenviar correo de verificación
const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    // Validar que se proporcione el email
    if (!email) {
      return res.status(400).json({ error: "El email es requerido" });
    }

    // Buscar usuario por email
    const user = await userService.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Verificar si la cuenta ya está verificada
    if (user.is_verified) {
      return res.status(400).json({ error: "La cuenta ya está verificada" });
    }

    // Generar nuevo token de verificación
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Actualizar el token en la base de datos
    await userService.update(user.id, { verification_token: verificationToken });

    // Enviar correo de verificación
    await sendVerificationEmail(email, verificationToken);

    res.json({ 
      success: true, 
      message: "Correo de verificación reenviado exitosamente. Revisa tu bandeja de entrada." 
    });
  } catch (error) {
    console.error("❌ Error al reenviar correo de verificación:", error);
    res.status(500).json({ error: "Error al reenviar el correo de verificación" });
  }
};

// 📌 Iniciar Sesión
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar campos requeridos
    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña son requeridos" });
    }

    // Buscar usuario
    const user = await userService.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Verificar si la cuenta está verificada
    if (!user.is_verified) {
      // Generar nuevo token de verificación
      const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
      
      // Actualizar el token en la base de datos
      await userService.update(user.id, { verification_token: verificationToken });
      
      // Enviar correo de verificación automáticamente
      await sendVerificationEmail(email, verificationToken);
      
      return res.status(401).json({ 
        error: "Por favor verifica tu cuenta primero. Se ha reenviado un nuevo correo de verificación.",
        verificationSent: true
      });
    }

    // Actualizar último login
    await userService.updateLastLogin(user.id);

    // Generar token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: "Login exitoso",
      token
    });
  } catch (error) {
    console.error("Error en loginUser:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// 📌 Actualizar Usuario
const updateUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userId = req.params.id;

    // Verificar si el usuario existe
    const user = await userService.findById(userId);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    // Preparar datos para actualizar
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    // Si hay un nuevo password, encriptarlo
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    // Actualizar usuario
    await userService.update(userId, updateData);

    res.json({ message: "Usuario actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
};

// 📌 Actualizar Perfil del Usuario Autenticado
const updateProfile = async (req, res) => {
  try {
    const { name, email, password, telefono, fechaNacimiento, direccion } = req.body;
    const userId = req.user.id; // Se obtiene del middleware de autenticación

    // Buscar el usuario por su ID
    const user = await userService.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Validar que el nuevo email no esté en uso por otro usuario
    if (email && email !== user.email) {
      const emailExists = await userService.findByEmail(email);
      if (emailExists) {
        return res.status(400).json({ error: "El email ya está en uso por otro usuario" });
      }
    }

    // Preparar datos para actualizar
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (telefono !== undefined) updateData.telefono = telefono;
    if (fechaNacimiento !== undefined) updateData.fecha_nacimiento = fechaNacimiento;
    if (direccion !== undefined) updateData.direccion = direccion;

    // Si hay una nueva contraseña, validarla y encriptarla
    if (password) {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ error: passwordValidation.message });
      }

      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    // Actualizar usuario
    const updatedUser = await userService.update(userId, updateData);

    // Devolver respuesta exitosa con los datos actualizados (sin contraseña)
    res.json({
      success: true,
      message: "Perfil actualizado exitosamente",
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        telefono: updatedUser.telefono,
        fecha_nacimiento: updatedUser.fecha_nacimiento,
        direccion: updatedUser.direccion,
        avatar: updatedUser.avatar
      }
    });
  } catch (error) {
    console.error("❌ Error al actualizar perfil:", error);
    res.status(500).json({ error: "Error al actualizar el perfil" });
  }
};

// 📌 Verificar Cuenta con el Token
const verifyUser = async (req, res) => {
  try {
    const { token } = req.params;

    // Decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuario con el email del token
    const user = await userService.findByEmail(decoded.email);

    if (!user) {
      return res.status(400).send(`
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Error de Verificación - ShopNodeCore</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
              .error { background: #ffe6e6; color: #d63031; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
              .info { background: #e6f3ff; color: #0984e3; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
              .btn { display: inline-block; padding: 12px 24px; background: #0984e3; color: white; text-decoration: none; border-radius: 5px; margin: 10px; }
              .btn-success { background: #00b894; }
              .btn-secondary { background: #636e72; }
              .form-group { margin: 15px 0; }
              input[type="email"] { 
                width: 100%; 
                padding: 12px; 
                border: 1px solid #ddd; 
                border-radius: 5px; 
                font-size: 16px; 
                margin-bottom: 10px; 
              }
              .hidden { display: none; }
              .loading { opacity: 0.6; pointer-events: none; }
            </style>
          </head>
          <body>
            <h1>🛒 ShopNodeCore</h1>
            
            <div class="error">
              <h2>❌ Error de Verificación</h2>
              <p>Token inválido o usuario no encontrado.</p>
              <p>Si ya te registraste, puedes solicitar un nuevo correo de verificación.</p>
            </div>

            <div class="info">
              <h3>📧 Solicitar Correo de Verificación</h3>
              <p>Si ya tienes una cuenta, ingresa tu correo para recibir un nuevo enlace de verificación:</p>
              
              <form id="resendForm">
                <div class="form-group">
                  <input type="email" id="emailInput" placeholder="tu@email.com" required>
                </div>
                <button type="submit" class="btn btn-success" id="resendBtn">
                  📧 Solicitar Correo de Verificación
                </button>
              </form>
              
              <div id="message" class="hidden"></div>
            </div>

            <a href="http://localhost:5173" class="btn btn-secondary">Volver al Inicio</a>

            <script>
              document.getElementById('resendForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const email = document.getElementById('emailInput').value;
                const resendBtn = document.getElementById('resendBtn');
                const messageDiv = document.getElementById('message');
                
                if (!email) {
                  showMessage('Por favor ingresa tu correo electrónico.', 'error');
                  return;
                }
                
                // Mostrar estado de carga
                resendBtn.textContent = '⏳ Enviando...';
                resendBtn.classList.add('loading');
                
                try {
                  const response = await fetch('/api/users/resend-verification', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email: email })
                  });
                  
                  const data = await response.json();
                  
                  if (response.ok) {
                    showMessage('✅ ' + data.message, 'success');
                    resendBtn.textContent = '📧 Correo Enviado';
                    resendBtn.disabled = true;
                  } else {
                    showMessage('❌ ' + (data.error || 'Error al enviar el correo'), 'error');
                    resendBtn.textContent = '📧 Solicitar Correo de Verificación';
                  }
                } catch (error) {
                  showMessage('❌ Error de conexión. Por favor intenta nuevamente.', 'error');
                  resendBtn.textContent = '📧 Solicitar Correo de Verificación';
                } finally {
                  resendBtn.classList.remove('loading');
                }
              });
              
              function showMessage(text, type) {
                const messageDiv = document.getElementById('message');
                messageDiv.textContent = text;
                messageDiv.className = type === 'success' ? 'info' : 'error';
                messageDiv.classList.remove('hidden');
                
                // Ocultar mensaje después de 5 segundos
                setTimeout(() => {
                  messageDiv.classList.add('hidden');
                }, 5000);
              }
            </script>
          </body>
        </html>
      `);
    }

    if (user.is_verified) {
      return res.status(200).send(`
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Cuenta Ya Verificada - ShopNodeCore</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
              .info { background: #e6f3ff; color: #0984e3; padding: 20px; border-radius: 10px; }
              .btn { display: inline-block; padding: 12px 24px; background: #00b894; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <h1>🛒 ShopNodeCore</h1>
            <div class="info">
              <h2>ℹ️ Cuenta Ya Verificada</h2>
              <p>Tu cuenta ya estaba confirmada anteriormente.</p>
              <p>Puedes iniciar sesión directamente.</p>
            </div>
            <a href="http://localhost:5173" class="btn">Iniciar Sesión</a>
          </body>
        </html>
      `);
    }

    // Marcar la cuenta como verificada
    await userService.update(user.id, { 
      is_verified: true, 
      verification_token: null 
    });

    // Página de éxito con redirección automática
    res.status(200).send(`
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Verificación Exitosa - ShopNodeCore</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
            .success { background: #e6ffed; color: #00b894; padding: 20px; border-radius: 10px; }
            .btn { display: inline-block; padding: 12px 24px; background: #00b894; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .countdown { font-size: 14px; color: #666; margin-top: 15px; }
          </style>
          <script>
            let countdown = 5;
            function updateCountdown() {
              document.getElementById('countdown').textContent = countdown;
              countdown--;
              if (countdown < 0) {
                window.location.href = 'http://localhost:5173';
              }
            }
            setInterval(updateCountdown, 1000);
          </script>
        </head>
        <body onload="updateCountdown()">
          <h1>🛒 ShopNodeCore</h1>
          <div class="success">
            <h2>✅ ¡Cuenta Verificada con Éxito!</h2>
            <p>Tu cuenta ha sido confirmada correctamente.</p>
            <p>Ya puedes iniciar sesión y comenzar a comprar.</p>
          </div>
          <a href="http://localhost:5173" class="btn">Iniciar Sesión Ahora</a>
          <div class="countdown">
            Serás redirigido automáticamente en <span id="countdown">5</span> segundos...
          </div>
        </body>
      </html>
    `);

    console.log(`✅ Cuenta verificada exitosamente: ${user.email}`);
  } catch (error) {
    console.error("❌ Error al verificar cuenta:", error);
    res.status(400).send(`
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Token Expirado - ShopNodeCore</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
            .error { background: #ffe6e6; color: #d63031; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
            .info { background: #e6f3ff; color: #0984e3; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
            .btn { display: inline-block; padding: 12px 24px; background: #0984e3; color: white; text-decoration: none; border-radius: 5px; margin: 10px; }
            .btn-success { background: #00b894; }
            .btn-secondary { background: #636e72; }
            .form-group { margin: 15px 0; }
            input[type="email"] { 
              width: 100%; 
              padding: 12px; 
              border: 1px solid #ddd; 
              border-radius: 5px; 
              font-size: 16px; 
              margin-bottom: 10px; 
            }
            .hidden { display: none; }
            .loading { opacity: 0.6; pointer-events: none; }
          </style>
        </head>
        <body>
          <h1>🛒 ShopNodeCore</h1>
          
          <div class="error">
            <h2>⏰ Token Expirado</h2>
            <p>El enlace de verificación ha expirado.</p>
            <p>No te preocupes, puedes obtener un nuevo enlace de verificación.</p>
          </div>

          <div class="info">
            <h3>📧 Reenviar Correo de Verificación</h3>
            <p>Ingresa tu correo electrónico para recibir un nuevo enlace de verificación:</p>
            
            <form id="resendForm">
              <div class="form-group">
                <input type="email" id="emailInput" placeholder="tu@email.com" required>
              </div>
              <button type="submit" class="btn btn-success" id="resendBtn">
                📧 Reenviar Correo de Verificación
              </button>
            </form>
            
            <div id="message" class="hidden"></div>
          </div>

          <a href="http://localhost:5173" class="btn btn-secondary">Volver al Inicio</a>

          <script>
            document.getElementById('resendForm').addEventListener('submit', async function(e) {
              e.preventDefault();
              
              const email = document.getElementById('emailInput').value;
              const resendBtn = document.getElementById('resendBtn');
              const messageDiv = document.getElementById('message');
              
              if (!email) {
                showMessage('Por favor ingresa tu correo electrónico.', 'error');
                return;
              }
              
              // Mostrar estado de carga
              resendBtn.textContent = '⏳ Enviando...';
              resendBtn.classList.add('loading');
              
              try {
                const response = await fetch('/api/users/resend-verification', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ email: email })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                  showMessage('✅ ' + data.message, 'success');
                  resendBtn.textContent = '📧 Correo Enviado';
                  resendBtn.disabled = true;
                } else {
                  showMessage('❌ ' + (data.error || 'Error al enviar el correo'), 'error');
                  resendBtn.textContent = '📧 Reenviar Correo de Verificación';
                }
              } catch (error) {
                showMessage('❌ Error de conexión. Por favor intenta nuevamente.', 'error');
                resendBtn.textContent = '📧 Reenviar Correo de Verificación';
              } finally {
                resendBtn.classList.remove('loading');
              }
            });
            
            function showMessage(text, type) {
              const messageDiv = document.getElementById('message');
              messageDiv.textContent = text;
              messageDiv.className = type === 'success' ? 'info' : 'error';
              messageDiv.classList.remove('hidden');
              
              // Ocultar mensaje después de 5 segundos
              setTimeout(() => {
                messageDiv.classList.add('hidden');
              }, 5000);
            }
          </script>
        </body>
      </html>
    `);
  }
};

// 📌 Solicitar recuperación de contraseña
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await userService.findByEmail(email);

    if (!user) {
      return res.status(400).json({ error: "No existe una cuenta con este correo." });
    }

    // Generar un JWT en lugar de un token aleatorio
    const resetToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Enviar correo con el enlace de restablecimiento
    await sendPasswordResetEmail(user.email, resetToken);

    res.json({ message: "Correo de recuperación enviado. Revisa tu bandeja de entrada." });
  } catch (error) {
    console.error("❌ Error en solicitud de recuperación:", error);
    res.status(500).json({ error: "Error al solicitar la recuperación de contraseña." });
  }
};

// 📌 Restablecer la contraseña
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Verificar el JWT
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(400).json({ error: "Token inválido o expirado." });
    }

    // Buscar usuario por email
    const user = await userService.findByEmail(decoded.email);
    if (!user) {
      return res.status(400).json({ error: "Usuario no encontrado." });
    }

    // Validar seguridad de la nueva contraseña
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    // Encriptar la nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Actualizar contraseña
    await userService.update(user.id, { password: hashedPassword });

    res.json({ message: "Contraseña restablecida con éxito. Ya puedes iniciar sesión." });
  } catch (error) {
    console.error("❌ Error al restablecer contraseña:", error);
    res.status(500).json({ error: "Error al restablecer la contraseña." });
  }
};

// 📌 Eliminar usuario
const deleteUser = async (req, res) => {
  try {
    console.log("Eliminando usuario:", req.params.id);
    
    const { email, password, confirmacion } = req.body;

    // Validar si la confirmación es correcta
    if (!confirmacion || confirmacion.toLowerCase() !== "eliminar") {
      return res.status(400).json({ error: "Debe confirmar la eliminación escribiendo 'eliminar'" });
    }

    // Buscar al usuario por email
    const user = await userService.findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Verificar que la contraseña sea correcta
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // Eliminar usuario
    await userService.delete(user.id);

    console.log("✅ Usuario eliminado correctamente:", email);
    res.status(200).json({ message: "Usuario eliminado con éxito" });

  } catch (error) {
    console.error("❌ Error al eliminar usuario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

// 📌 Obtener datos del usuario por ID o email
const getUserData = async (req, res) => {
  try {
    const { identifier } = req.params; // Puede ser ID o email

    // Intentar buscar por ID primero (verificar si es un número)
    let user = null;
    if (!isNaN(identifier)) {
      user = await userService.findById(identifier);
    }

    // Si no se encuentra por ID, buscar por email
    if (!user) {
      user = await userService.findByEmail(identifier);
    }

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Devolver los datos del usuario (sin la contraseña y el token de verificación)
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_verified: user.is_verified,
      avatar: user.avatar,
      telefono: user.telefono,
      fecha_nacimiento: user.fecha_nacimiento,
      direccion: user.direccion,
      created_at: user.created_at,
      last_login: user.last_login
    };

    res.json(userResponse);
  } catch (error) {
    console.error("❌ Error al obtener los datos del usuario:", error);
    res.status(500).json({ error: "Error al obtener los datos del usuario" });
  }
};

// 📌 Subir avatar
const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.id; // Se obtiene del middleware de autenticación
    const user = await userService.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    } 

    // Verificar si se subió un archivo
    if (!req.file) {
      return res.status(400).json({ error: "No se ha subido ninguna imagen." });
    }

    // Guardar la URL del avatar en la base de datos
    const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    await userService.update(userId, { avatar: avatarUrl });

    res.json({ message: "Foto de perfil actualizada", avatar: avatarUrl });
  } catch (error) {
    console.error("❌ Error al actualizar la foto de perfil:", error);
    res.status(500).json({ error: "Error al actualizar la foto de perfil" });
  }
};

// 📌 Obtener todos los usuarios (Solo para administradores)
const getAllUsers = async (req, res) => {
  try {
    // Obtener todos los usuarios de la base de datos
    const users = await userService.findAll();

    // Filtrar información sensible y formatear respuesta
    const usersData = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      is_verified: user.is_verified,
      avatar: user.avatar,
      telefono: user.telefono,
      fecha_nacimiento: user.fecha_nacimiento,
      direccion: user.direccion,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login: user.last_login
    }));

    res.json({
      success: true,
      message: "Lista de usuarios obtenida exitosamente",
      total: usersData.length,
      data: usersData
    });
  } catch (error) {
    console.error("❌ Error al obtener todos los usuarios:", error);
    res.status(500).json({ 
      success: false,
      error: "Error interno del servidor al obtener los usuarios" 
    });
  }
};

export { 
  registerUser, 
  loginUser, 
  updateUser, 
  updateProfile, 
  verifyUser, 
  resendVerificationEmail,
  requestPasswordReset, 
  resetPassword, 
  deleteUser, 
  getUserData, 
  uploadAvatar,
  getAllUsers
};