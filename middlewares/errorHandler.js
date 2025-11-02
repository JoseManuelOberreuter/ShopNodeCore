import logger from '../utils/logger.js';

/**
 * Global error handler middleware
 * Sanitizes error responses in production for security
 */
export const errorHandler = (err, req, res, next) => {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  // Log error with sanitization
  logger.error('Error occurred:', {
    message: err.message,
    stack: isDevelopment ? err.stack : undefined,
    path: req.path,
    method: req.method,
    status: err.status || err.statusCode || 500
  });
  
  // Prepare error response
  const status = err.status || err.statusCode || 500;
  
  // In production, don't expose error details
  if (!isDevelopment) {
    // Generic error messages for production
    const productionError = {
      error: status >= 500 
        ? 'Internal server error' 
        : err.message || 'An error occurred',
      ...(status >= 500 && { statusCode: status })
    };
    
    return res.status(status).json(productionError);
  }
  
  // In development, show detailed errors
  res.status(status).json({
    error: err.message || 'An error occurred',
    stack: err.stack,
    statusCode: status,
    ...(err.details && { details: err.details })
  });
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

/**
 * Async handler wrapper to catch errors in async routes
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default errorHandler;

