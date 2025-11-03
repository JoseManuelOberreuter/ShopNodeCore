// Serverless handler for Vercel
// This file exports the Express app as a serverless function

import dotenv from 'dotenv';
dotenv.config();

// Import database connection (Supabase client is created immediately on import)
import '../database.js';

// Import the Express app
import app from '../server.js';

// Export the app as the serverless function handler
// Vercel will automatically use this as the handler for all routes
// Note: No app.listen() needed - Vercel handles the server lifecycle
export default app;

