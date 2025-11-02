/**
 * Secure logging utility that sanitizes sensitive information
 * Logs are only shown in development mode for security
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * Sanitize email addresses
 * @param {string} email - Email to sanitize
 * @returns {string} - Sanitized email (only first 2 chars visible)
 */
const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '[REDACTED]';
  if (!email.includes('@')) return email;
  
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) return email;
  
  const visibleChars = localPart.substring(0, 2);
  const hiddenChars = '*'.repeat(Math.min(localPart.length - 2, 8));
  return `${visibleChars}${hiddenChars}@${domain}`;
};

/**
 * Sanitize IDs (user IDs, order IDs, etc.)
 * @param {string|number} id - ID to sanitize
 * @returns {string} - Sanitized ID
 */
const sanitizeId = (id) => {
  if (!id) return '[REDACTED]';
  const idStr = String(id);
  if (idStr.length <= 4) return idStr;
  return `${idStr.substring(0, 2)}***${idStr.substring(idStr.length - 2)}`;
};

/**
 * Sanitize tokens (JWT tokens, verification tokens, etc.)
 * @param {string} token - Token to sanitize
 * @returns {string} - Sanitized token
 */
const sanitizeToken = (token) => {
  if (!token || typeof token !== 'string') return '[REDACTED]';
  if (token.length <= 8) return '***';
  return `${token.substring(0, 4)}***${token.substring(token.length - 4)}`;
};

/**
 * Sanitize URLs that may contain sensitive information
 * @param {string} url - URL to sanitize
 * @returns {string} - Sanitized URL
 */
const sanitizeUrl = (url) => {
  if (!url || typeof url !== 'string') return '[REDACTED]';
  
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Sanitize email-like parts in URL
    const sanitizedPath = pathParts.map(part => {
      if (part.includes('@')) {
        return sanitizeEmail(part);
      }
      // Check if it looks like an ID
      if (/^\d+$/.test(part) && part.length > 4) {
        return sanitizeId(part);
      }
      return part;
    }).join('/');
    
    return `${urlObj.origin}${sanitizedPath}`;
  } catch {
    // If URL parsing fails, try basic sanitization
    return url.replace(/\/users\/profile\/[^\/]+/g, '/users/profile/[REDACTED]');
  }
};

/**
 * Recursively sanitize objects
 * @param {any} obj - Object to sanitize
 * @param {number} depth - Current depth (prevent infinite recursion)
 * @returns {any} - Sanitized object
 */
const sanitizeObject = (obj, depth = 0) => {
  if (depth > 10) return '[MAX DEPTH]';
  
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    // Check if it's an email
    if (obj.includes('@') && obj.includes('.')) {
      return sanitizeEmail(obj);
    }
    // Check if it's a token-like string (long alphanumeric)
    if (obj.length > 20 && /^[a-zA-Z0-9._-]+$/.test(obj)) {
      return sanitizeToken(obj);
    }
    // Check if it's a URL
    if (obj.startsWith('http://') || obj.startsWith('https://')) {
      return sanitizeUrl(obj);
    }
    return obj;
  }
  
  if (typeof obj === 'number') {
    // Large numbers might be IDs
    if (obj > 1000) {
      return sanitizeId(String(obj));
    }
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, depth + 1));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    const sensitiveKeys = ['email', 'token', 'password', 'authorization', 'jwt', 'secret', 'key', 'id', 'userId', 'user_id', 'orderId', 'order_id'];
    
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      
      if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
        if (typeof value === 'string') {
          if (lowerKey.includes('email')) {
            sanitized[key] = sanitizeEmail(value);
          } else if (lowerKey.includes('token') || lowerKey.includes('jwt') || lowerKey.includes('secret')) {
            sanitized[key] = sanitizeToken(value);
          } else if (lowerKey.includes('id')) {
            sanitized[key] = sanitizeId(value);
          } else {
            sanitized[key] = '[REDACTED]';
          }
        } else if (typeof value === 'number' && lowerKey.includes('id')) {
          sanitized[key] = sanitizeId(String(value));
        } else {
          sanitized[key] = sanitizeObject(value, depth + 1);
        }
      } else {
        sanitized[key] = sanitizeObject(value, depth + 1);
      }
    }
    
    return sanitized;
  }
  
  return obj;
};

/**
 * Secure logger - only logs in development or sanitized in production
 */
export const logger = {
  /**
   * Log info messages (only in development)
   */
  info: (...args) => {
    if (isDevelopment) {
      console.log('[INFO]', ...args);
    }
  },
  
  /**
   * Log error messages (sanitized in production)
   */
  error: (...args) => {
    if (isDevelopment) {
      console.error('[ERROR]', ...args);
    } else {
      // In production, sanitize sensitive data
      const sanitized = args.map(arg => sanitizeObject(arg));
      console.error('[ERROR]', ...sanitized);
    }
  },
  
  /**
   * Log warning messages
   */
  warn: (...args) => {
    if (isDevelopment) {
      console.warn('[WARN]', ...args);
    }
  },
  
  /**
   * Log debug messages (only in development)
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },
  
  /**
   * Log with automatic sanitization
   */
  safe: (...args) => {
    const sanitized = args.map(arg => sanitizeObject(arg));
    if (isDevelopment) {
      console.log('[SAFE]', ...sanitized);
    } else {
      console.log('[SAFE]', ...sanitized);
    }
  }
};

export default logger;

