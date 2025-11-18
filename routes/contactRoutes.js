import express from 'express';
import { submitContactForm } from '../controllers/contactController.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for contact form (stricter than general routes to prevent spam)
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 20, // Limit to 5 requests per window in production, 20 in development
  message: 'Demasiados intentos de envío. Por favor, intenta de nuevo más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests, not just failed ones
});

// POST /api/contact - Submit contact form
router.post('/', contactLimiter, submitContactForm);

export default router;

