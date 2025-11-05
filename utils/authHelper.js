// utils/authHelper.js
// Helper functions for authentication and authorization

import { unauthorizedResponse, forbiddenResponse } from './responseHelper.js';

/**
 * Verify that the user is authenticated
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {boolean} - Returns true if authenticated, false otherwise
 */
export const requireAuth = (req, res) => {
  if (!req.user) {
    unauthorizedResponse(res, 'Debes iniciar sesión para acceder a este recurso.');
    return false;
  }
  return true;
};

/**
 * Verify that the user is an administrator
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @returns {boolean} - Returns true if admin, false otherwise
 */
export const requireAdmin = (req, res) => {
  if (!req.user) {
    unauthorizedResponse(res, 'Debes iniciar sesión para acceder a este recurso.');
    return false;
  }

  // Check if user is admin (handle both 'admin' role and isAdmin flag)
  const isAdmin = req.user.role === 'admin' || req.user.isAdmin === true;
  
  if (!isAdmin) {
    forbiddenResponse(res, 'No tienes permisos para acceder a esta información.');
    return false;
  }

  return true;
};

/**
 * Get user ID from request in a safe way
 * @param {object} req - Express request object
 * @returns {number|null} - User ID or null if not authenticated
 */
export const getUserId = (req) => {
  return req.user?.id || null;
};

/**
 * Check if the current user owns a resource or is an admin
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {number} resourceUserId - User ID of the resource owner
 * @returns {boolean} - Returns true if user owns resource or is admin, false otherwise
 */
export const requireOwnershipOrAdmin = (req, res, resourceUserId) => {
  if (!req.user) {
    unauthorizedResponse(res, 'Debes iniciar sesión para acceder a este recurso.');
    return false;
  }

  const isAdmin = req.user.role === 'admin' || req.user.isAdmin === true;
  const isOwner = req.user.id === resourceUserId;

  if (!isOwner && !isAdmin) {
    forbiddenResponse(res, 'No tienes permisos para acceder a este recurso.');
    return false;
  }

  return true;
};

