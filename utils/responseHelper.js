// utils/responseHelper.js
// Helper functions for standardized HTTP responses

/**
 * Send a successful response
 * @param {object} res - Express response object
 * @param {any} data - Data to send in response
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
export const successResponse = (res, data = null, message = null, statusCode = 200) => {
  const response = {
    success: true
  };

  if (message) {
    response.message = message;
  }

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send an error response
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 400)
 * @param {any} error - Additional error details (optional)
 */
export const errorResponse = (res, message, statusCode = 400, error = null) => {
  const response = {
    success: false,
    error: message
  };

  if (error && process.env.NODE_ENV === 'development') {
    response.details = error;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send a 404 Not Found response
 * @param {object} res - Express response object
 * @param {string} resource - Name of the resource not found (default: 'Recurso')
 */
export const notFoundResponse = (res, resource = 'Recurso') => {
  return res.status(404).json({
    success: false,
    error: `${resource} no encontrado`
  });
};

/**
 * Send a 401 Unauthorized response
 * @param {object} res - Express response object
 * @param {string} message - Unauthorized message (default: 'No autorizado')
 */
export const unauthorizedResponse = (res, message = 'No autorizado') => {
  return res.status(401).json({
    success: false,
    error: message
  });
};

/**
 * Send a 403 Forbidden response
 * @param {object} res - Express response object
 * @param {string} message - Forbidden message (default: 'Acceso denegado')
 */
export const forbiddenResponse = (res, message = 'Acceso denegado') => {
  return res.status(403).json({
    success: false,
    error: message
  });
};

/**
 * Send a 500 Internal Server Error response
 * @param {object} res - Express response object
 * @param {Error} error - Error object
 * @param {string} message - Error message (default: 'Error interno del servidor')
 */
export const serverErrorResponse = (res, error, message = 'Error interno del servidor') => {
  const response = {
    success: false,
    error: message
  };

  if (process.env.NODE_ENV === 'development' && error) {
    response.details = error.message;
  }

  return res.status(500).json(response);
};

