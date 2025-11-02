import jwt from 'jsonwebtoken';
import { userService } from '../models/userModel.js';
import logger from '../utils/logger.js';

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization");
    if (!token) {
      logger.warn("No hay token en la solicitud", { path: req.path, method: req.method });
      return res.status(401).json({ error: "Acceso denegado. No hay token." });
    }

    // Verificar y decodificar el token
    const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);

    // Buscar usuario completo en la base de datos
    const user = await userService.findById(decoded.id);
    if (!user) {
      logger.warn("Token inválido - Usuario no encontrado", { 
        userId: decoded.id,
        path: req.path 
      });
      return res.status(401).json({ error: "Token inválido. Usuario no encontrado." });
    }

    // Guardar la información completa del usuario en `req.user`
    req.user = {
      id: user.id,
      _id: user.id, // Mantener retrocompatibilidad
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.is_verified,
      isAdmin: user.role === 'admin' // Agregar propiedad isAdmin para compatibilidad
    };

    next(); // Continuar con la ejecución de la ruta
  } catch (error) {
    logger.error("Error en la autenticación:", { 
      message: error.message,
      path: req.path,
      method: req.method 
    });
    return res.status(403).json({ error: "Token inválido o expirado." });
  }
};

export default authMiddleware;
