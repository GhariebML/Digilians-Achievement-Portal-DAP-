import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  // Use service role key if available, otherwise anon key, otherwise empty
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
  jwtSecret: process.env.JWT_SECRET || 'digilians_portal_jwt_secret_key_2026_super_secure',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'digilians_portal_refresh_secret_key_2026_refresh_token',
  googleSheetsUrl: process.env.GOOGLE_SHEETS_API_URL || process.env.VITE_GOOGLE_SHEETS_API_URL || '',
  isFallbackMode: process.env.MOCK_DB === 'true' || false
};

// Check if credentials are present, otherwise default to fallback mode
if (!config.supabaseUrl || !config.supabaseKey) {
  config.isFallbackMode = true;
  console.warn('Supabase credentials missing. API running in SECURE fallback simulation mode (localStorage-equivalent in-memory state).');
}

export default config;
