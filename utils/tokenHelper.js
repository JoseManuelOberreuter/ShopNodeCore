// utils/tokenHelper.js
// Helper functions for JWT token operations

import jwt from 'jsonwebtoken';

/**
 * Generate a verification token for email verification
 * @param {string} email - User email
 * @param {string} expiresIn - Token expiration (default: '1h')
 * @returns {string} - JWT token
 */
export const generateVerificationToken = (email, expiresIn = '1h') => {
  return jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Generate a password reset token
 * @param {string} email - User email
 * @param {string} expiresIn - Token expiration (default: '1h')
 * @returns {string} - JWT token
 */
export const generateResetToken = (email, expiresIn = '1h') => {
  return jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Generate an authentication token for user login
 * @param {object} user - User object with id and email
 * @param {string} expiresIn - Token expiration (default: '1h')
 * @returns {string} - JWT token
 */
export const generateAuthToken = (user, expiresIn = '1h') => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

/**
 * Verify a JWT token
 * @param {string} token - JWT token to verify
 * @returns {object} - Decoded token payload
 * @throws {Error} - If token is invalid or expired
 */
export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

