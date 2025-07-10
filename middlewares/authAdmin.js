// 📌 MIDDLEWARE PARA VERIFICAR SI EL USUARIO ES ADMINISTRADOR
const authAdmin = (req, res, next) => {
  try {
    // Verificar que el usuario esté autenticado
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación requerido'
      });
    }

    // Verificar que el usuario tenga rol de administrador
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requieren permisos de administrador'
      });
    }

    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en la verificación de autorización',
      error: error.message
    });
  }
};

export default authAdmin;
