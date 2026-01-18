/**
 * Supabase Configuration
 * Centralized Supabase client initialization
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// Validate environment variables
if (!process.env.SUPABASE_URL) {
  throw new Error("Missing SUPABASE_URL environment variable");
}

if (!process.env.SUPABASE_SERVICE_KEY) {
  throw new Error("Missing SUPABASE_SERVICE_KEY environment variable");
}

// Create Supabase client with service role key (for backend)
// This bypasses Row Level Security for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    db: {
      schema: "public",
    },
  },
);

// Test connection on initialization
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from("roles")
      .select("count")
      .limit(1);

    if (error) throw error;
    console.log("✅ Supabase connection successful");
  } catch (error) {
    console.error("❌ Supabase connection failed:", error.message);
    process.exit(1);
  }
}

// Run connection test in development
if (process.env.NODE_ENV !== "production") {
  testConnection();
}

module.exports = supabase;
