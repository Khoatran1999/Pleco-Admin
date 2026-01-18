/**
 * Script to create admin user in Supabase Auth
 * Run: node backend/seed-admin.js
 */

const supabase = require("./src/config/supabase");

async function seedAdminUser() {
  console.log("🌱 Seeding admin user...");

  const adminEmail = "admin@fishmarket.com";
  const adminPassword = "admin123";
  const adminUsername = "admin";
  const adminFullName = "Admin User";

  try {
    // Check if user already exists in Supabase Auth
    const { data: existingAuthUser } = await supabase.auth.admin.listUsers();
    const userExists = existingAuthUser.users.find(
      (u) => u.email === adminEmail,
    );

    if (userExists) {
      console.log("✅ Admin user already exists in Supabase Auth");
      console.log("   Email:", adminEmail);
      console.log("   Password:", adminPassword);
      return;
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: adminFullName,
          username: adminUsername,
        },
      });

    if (authError) {
      console.error("❌ Error creating auth user:", authError.message);
      return;
    }

    console.log("✅ Admin user created in Supabase Auth");

    // Check if user exists in database
    const { data: dbUser } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", adminEmail)
      .single();

    if (!dbUser) {
      // Get admin role
      const { data: adminRole } = await supabase
        .from("roles")
        .select("id")
        .eq("name", "admin")
        .single();

      // Create user in database
      const { error: dbError } = await supabase.from("users").insert({
        username: adminUsername,
        email: adminEmail,
        full_name: adminFullName,
        role_id: adminRole?.id || 1,
        password: "managed_by_supabase_auth",
        is_active: true,
      });

      if (dbError) {
        console.error("❌ Error creating database user:", dbError.message);
        return;
      }

      console.log("✅ Admin user created in database");
    } else {
      console.log("✅ Admin user already exists in database");
    }

    console.log("\n🎉 Admin user ready!");
    console.log("📧 Email:   ", adminEmail);
    console.log("🔑 Password:", adminPassword);
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

// Run the seed
seedAdminUser()
  .then(() => {
    console.log("\n✨ Seeding complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Seeding failed:", error);
    process.exit(1);
  });
