/**
 * Supabase Configuration
 * Centralized Supabase client initialization
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Validate environment variables with helpful error messages
// Skip strict validation during tests to allow running unit/integration tests locally
if (process.env.NODE_ENV !== 'test') {
  if (!process.env.SUPABASE_URL) {
    console.error('❌ Missing SUPABASE_URL environment variable');
    console.error('   Please add SUPABASE_URL to your Vercel environment variables');
    console.error('   Find it at: Supabase Dashboard → Settings → API → Project URL');
    throw new Error('Missing SUPABASE_URL environment variable');
  }

  if (!process.env.SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing SUPABASE_SERVICE_KEY environment variable');
    console.error('   Please add SUPABASE_SERVICE_KEY to your Vercel environment variables');
    console.error('   Find it at: Supabase Dashboard → Settings → API → service_role key');
    console.error("   ⚠️  Note: Use 'service_role' key, NOT 'anon' key");
    throw new Error('Missing SUPABASE_SERVICE_KEY environment variable');
  }
}

// Create Supabase client with service role key (for backend)
// This bypasses Row Level Security for admin operations
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  db: {
    schema: 'public',
  },
});

// Test connection on initialization
async function testConnection() {
  try {
    const { data, error } = await supabase.from('roles').select('count').limit(1);

    if (error) throw error;
    console.log('✅ Supabase connection successful');
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    process.exit(1);
  }
}

// Run connection test only in development (avoid running in tests)
if (process.env.NODE_ENV === 'development') {
  testConnection();
}

module.exports = supabase;
