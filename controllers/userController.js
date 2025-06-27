const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mongoose = require('mongoose');

const { sendVerificationEmail, sendPasswordResetEmail  } = require('../utils/mailer');
const { validatePassword } = require('../utils/passwordValidator'); 

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
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: "El usuario ya existe" });
    }

    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generar Token para verificación
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Crear usuario
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      isVerified: false,
      verificationToken
    });

    await newUser.save();

    // Enviar correo de verificación
    await sendVerificationEmail(email, verificationToken);

    // Devolver respuesta exitosa
    res.status(201).json({
      message: "Usuario registrado exitosamente",
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        isVerified: newUser.isVerified
      }
    });
  } catch (error) {
    console.error("Error en registerUser:", error);
    res.status(500).json({ error: "Error interno del servidor" });
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
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Verificar si la cuenta está verificada
    if (!user.isVerified) {
      return res.status(401).json({ error: "Por favor verifica tu cuenta primero" });
    }

    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: user._id, email: user.email },
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
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    // Si hay un nuevo password, encriptarlo
    let hashedPassword = user.password;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    // Actualizar datos
    user.name = name || user.name;
    user.email = email || user.email;
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Usuario actualizado correctamente" });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
};

// 📌 Verificar Cuenta con el Token
const verifyUser = async (req, res) => {
  try {
    const { token } = req.params;

    // Decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar usuario con el email del token
    const user = await User.findOne({ email: decoded.email });

    if (!user) {
      return res.status(400).send(`
        <html>
          <head>
            <meta charset="UTF-8">
            <title>Error de Verificación - ShopNodeCore</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
              .error { background: #ffe6e6; color: #d63031; padding: 20px; border-radius: 10px; }
              .btn { display: inline-block; padding: 12px 24px; background: #0984e3; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <h1>🛒 ShopNodeCore</h1>
            <div class="error">
              <h2>❌ Error de Verificación</h2>
              <p>Token inválido o usuario no encontrado.</p>
              <p>Por favor, intenta registrarte nuevamente.</p>
            </div>
            <a href="http://localhost:5173" class="btn">Volver al Inicio</a>
          </body>
        </html>
      `);
    }

    if (user.isVerified) {
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
    user.isVerified = true;
    user.verificationToken = undefined; // Eliminamos el token de la BD
    await user.save();

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
            .error { background: #ffe6e6; color: #d63031; padding: 20px; border-radius: 10px; }
            .btn { display: inline-block; padding: 12px 24px; background: #0984e3; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <h1>🛒 ShopNodeCore</h1>
          <div class="error">
            <h2>⏰ Token Expirado</h2>
            <p>El enlace de verificación ha expirado.</p>
            <p>Por favor, intenta registrarte nuevamente para obtener un nuevo enlace.</p>
          </div>
          <a href="http://localhost:5173" class="btn">Registrarse Nuevamente</a>
        </body>
      </html>
    `);
  }
};

// 📌 Solicitar recuperación de contraseña
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

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
    const user = await User.findOne({ email: decoded.email });
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
    user.password = await bcrypt.hash(password, salt);

    await user.save();

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
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Verificar que la contraseña sea correcta
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Contraseña incorrecta" });
    }

    // Eliminar usuario
    await User.deleteOne({ email });

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

    // Intentar buscar por ID primero
    let user = null;
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      user = await User.findById(identifier).select('-password -verificationToken');
    }

    // Si no se encuentra por ID, buscar por email
    if (!user) {
      user = await User.findOne({ email: identifier }).select('-password -verificationToken');
    }

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Devolver los datos del usuario (sin la contraseña y el token de verificación)
    res.json(user);
  } catch (error) {
    console.error("❌ Error al obtener los datos del usuario:", error);
    res.status(500).json({ error: "Error al obtener los datos del usuario" });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    const userId = req.user.id; // Se obtiene del middleware de autenticación
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    } 

    // Verificar si se subió un archivo
    if (!req.file) {
      return res.status(400).json({ error: "No se ha subido ninguna imagen." });
    }

    // Guardar la URL del avatar en la base de datos
    user.avatar = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    await user.save();

    res.json({ message: "Foto de perfil actualizada", avatar: user.avatar });
  } catch (error) {
    console.error("❌ Error al actualizar la foto de perfil:", error);
    res.status(500).json({ error: "Error al actualizar la foto de perfil" });
  }
};


module.exports = { registerUser, loginUser, updateUser, verifyUser, requestPasswordReset, resetPassword, deleteUser, getUserData, uploadAvatar };