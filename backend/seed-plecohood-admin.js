/**
 * Seed Plecohood Admin User
 * Creates admin user: plecohood@gmail.com
 */

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function seedPlecohoodAdmin() {
  try {
    console.log("🚀 Creating Plecohood admin user...");

    // User details
    const email = "plecohood@gmail.com";
    const password = "plecohoodAa@";
    const fullName = "Plecohood";
    const username = "plecohood";

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", email)
      .single();

    if (existingUser) {
      console.log("⚠️  User already exists:", existingUser.email);
      return;
    }

    // Get admin role
    const { data: adminRole, error: roleError } = await supabase
      .from("roles")
      .select("id, name")
      .eq("name", "admin")
      .single();

    if (roleError || !adminRole) {
      console.error("❌ Admin role not found. Creating roles first...");
      
      // Create roles if not exist
      const roles = [
        { name: "admin", description: "Full system access" },
        { name: "manager", description: "Manage operations" },
        { name: "staff", description: "Basic access" },
      ];

      await supabase.from("roles").insert(roles);
      
      const { data: newAdminRole } = await supabase
        .from("roles")
        .select("id")
        .eq("name", "admin")
        .single();
      
      adminRole.id = newAdminRole.id;
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        username: username,
      },
    });

    if (authError) {
      console.error("❌ Failed to create auth user:", authError.message);
      return;
    }

    console.log("✅ Auth user created:", authData.user.email);

    // Create user record in database
    const { data: userData, error: dbError } = await supabase
      .from("users")
      .insert({
        username: username,
        email: email,
        full_name: fullName,
        role_id: adminRole.id,
        is_active: true,
        password: "managed_by_supabase_auth",
      })
      .select()
      .single();

    if (dbError) {
      console.error("❌ Failed to create user record:", dbError.message);
      // Cleanup: delete auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      return;
    }

    console.log("✅ Database user created");
    console.log("\n📧 Login Credentials:");
    console.log("   Email:", email);
    console.log("   Password:", password);
    console.log("   Role: Admin\n");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

seedPlecohoodAdmin()
  .then(() => {
    console.log("✅ Seed completed");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });
