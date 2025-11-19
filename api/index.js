// Serverless handler for Vercel
// This file exports the Express app as a serverless function

import dotenv from 'dotenv';
dotenv.config();

// Verify required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_KEY'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('⚠️ Missing required environment variables:', missingVars.join(', '));
  console.error('Please configure these in your Vercel project settings');
}

// Check for recommended environment variables
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY is not set');
  console.warn('   Admin operations (product/user management) may fail due to RLS policies');
  console.warn('   Please configure SUPABASE_SERVICE_ROLE_KEY in your Vercel project settings');
}

// Import database connection (Supabase client is created immediately on import)
// This will create the supabase client even if variables are missing (database.js handles it gracefully)
import '../database.js';

// Import the Express app
import app from '../server.js';

// Export the app as the serverless function handler
// Vercel will automatically use this as the handler for all routes
// Note: No app.listen() needed - Vercel handles the server lifecycle
export default app;

