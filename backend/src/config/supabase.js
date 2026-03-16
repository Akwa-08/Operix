// backend/src/config/supabase.js
// REFACTORED: Added SUPABASE_ANON_KEY to required env vars
// The anon key is needed by createAuthenticatedClient() in authMiddleware.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Validate environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON_KEY'  // NEW: needed for per-request RLS-respecting client
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// ── Service Role Client ──────────────────────────────────────────────────────
// BYPASSES RLS — has full database access. Use for:
//   - Admin operations (createUser, deleteUser, updateUserById)
//   - Multi-table transactions
//   - Backend-to-database operations where RLS is too restrictive
//
// DO NOT use for customer-facing reads where data should be scoped to the user.

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Test connection on startup
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) throw error;
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    return false;
  }
};

module.exports = {
  supabase,
  testConnection
};