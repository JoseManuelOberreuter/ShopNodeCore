const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization");
    if (!token) {
      console.log("⛔ No hay token en la solicitud");
      return res.status(401).json({ error: "Acceso denegado. No hay token." });
    }

    // Verificar y decodificar el token
    const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);

    // Buscar usuario completo en la base de datos
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ error: "Token inválido. Usuario no encontrado." });
    }

    // Guardar la información completa del usuario en `req.user`
    req.user = {
      id: user._id,
      _id: user._id, // Mantener retrocompatibilidad
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified
    };

    next(); // Continuar con la ejecución de la ruta
  } catch (error) {
    console.error("⛔ Error en la autenticación:", error);
    return res.status(403).json({ error: "Token inválido o expirado." });
  }
};

module.exports = authMiddleware;
