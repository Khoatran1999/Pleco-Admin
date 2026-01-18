/**
 * SQLite to Supabase Data Migration Script
 * Exports data from SQLite database and imports to Supabase
 */

const Database = require("better-sqlite3");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

// Initialize SQLite
const sqliteDb = new Database(
  path.join(__dirname, "../database/fishmarket.db"),
);

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

// Color console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Migration functions for each table
async function migrateRoles() {
  log("\n📋 Migrating roles...", "blue");

  const roles = sqliteDb.prepare("SELECT * FROM roles").all();
  log(`Found ${roles.length} roles in SQLite`, "yellow");

  for (const role of roles) {
    const { error } = await supabase.from("roles").upsert(
      {
        id: role.id,
        name: role.name,
        description: role.description,
        created_at: role.created_at,
      },
      { onConflict: "id" },
    );

    if (error) {
      log(`❌ Error migrating role ${role.name}: ${error.message}`, "red");
    } else {
      log(`✅ Migrated role: ${role.name}`, "green");
    }
  }
}

async function migrateUsers() {
  log("\n👥 Migrating users...", "blue");

  const users = sqliteDb
    .prepare(
      `
    SELECT u.*, r.name as role_name 
    FROM users u 
    LEFT JOIN roles r ON u.role_id = r.id
  `,
    )
    .all();

  log(`Found ${users.length} users in SQLite`, "yellow");

  for (const user of users) {
    // Note: Passwords are hashed, cannot be used for Supabase Auth
    // Users will need to reset passwords or we create with temporary password
    const { error } = await supabase.from("users").upsert(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        role_id: user.role_id,
        is_active: user.is_active === 1,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      { onConflict: "id" },
    );

    if (error) {
      log(`❌ Error migrating user ${user.username}: ${error.message}`, "red");
    } else {
      log(`✅ Migrated user: ${user.username} (${user.role_name})`, "green");
    }
  }

  log(
    "\n⚠️  Important: Users need to reset passwords via Supabase Auth!",
    "yellow",
  );
}

async function migrateSuppliers() {
  log("\n🏢 Migrating suppliers...", "blue");

  const suppliers = sqliteDb.prepare("SELECT * FROM suppliers").all();
  log(`Found ${suppliers.length} active suppliers in SQLite`, "yellow");

  for (const supplier of suppliers) {
    const { error } = await supabase.from("suppliers").upsert(
      {
        id: supplier.id,
        name: supplier.name,
        contact_person: supplier.contact_person,
        phone: supplier.phone,
        email: supplier.email,
        address: supplier.address,
        tax_code: supplier.tax_code,
        notes: supplier.notes,
        avatar_url: supplier.avatar_url,
        created_at: supplier.created_at,
        updated_at: supplier.updated_at,
      },
      { onConflict: "id" },
    );

    if (error) {
      log(
        `❌ Error migrating supplier ${supplier.name}: ${error.message}`,
        "red",
      );
    } else {
      log(`✅ Migrated supplier: ${supplier.name}`, "green");
    }
  }
}

async function migrateCustomers() {
  log("\n👤 Migrating customers...", "blue");

  const customers = sqliteDb.prepare("SELECT * FROM customers").all();
  log(`Found ${customers.length} active customers in SQLite`, "yellow");

  for (const customer of customers) {
    const { error } = await supabase.from("customers").upsert(
      {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        social: customer.social,
        address: customer.address,
        tax_code: customer.tax_code,
        customer_type: customer.customer_type,
        notes: customer.notes,
        created_at: customer.created_at,
        updated_at: customer.updated_at,
      },
      { onConflict: "id" },
    );

    if (error) {
      log(
        `❌ Error migrating customer ${customer.name}: ${error.message}`,
        "red",
      );
    } else {
      log(`✅ Migrated customer: ${customer.name}`, "green");
    }
  }
}

async function migrateCategories() {
  log("\n📂 Migrating fish categories...", "blue");

  const categories = sqliteDb.prepare("SELECT * FROM fish_categories").all();
  log(`Found ${categories.length} active categories in SQLite`, "yellow");

  for (const category of categories) {
    const { error } = await supabase.from("fish_categories").upsert(
      {
        id: category.id,
        name: category.name,
        description: category.description,
        created_at: category.created_at,
        updated_at: category.updated_at,
      },
      { onConflict: "id" },
    );

    if (error) {
      log(
        `❌ Error migrating category ${category.name}: ${error.message}`,
        "red",
      );
    } else {
      log(`✅ Migrated category: ${category.name}`, "green");
    }
  }
}

async function migrateFishes() {
  log("\n🐟 Migrating fishes...", "blue");

  const fishes = sqliteDb.prepare("SELECT * FROM fishes").all();
  log(`Found ${fishes.length} active fishes in SQLite`, "yellow");

  for (const fish of fishes) {
    const { error } = await supabase.from("fishes").upsert(
      {
        id: fish.id,
        name: fish.name,
        category_id: fish.category_id,
        unit: fish.unit,
        min_stock: fish.min_stock,
        import_price: fish.import_price,
        sale_price: fish.sale_price,
        description: fish.description,
        image_url: fish.image_url,
        created_at: fish.created_at,
        updated_at: fish.updated_at,
      },
      { onConflict: "id" },
    );

    if (error) {
      log(`❌ Error migrating fish ${fish.name}: ${error.message}`, "red");
    } else {
      log(`✅ Migrated fish: ${fish.name}`, "green");
    }
  }
}

async function migrateInventories() {
  log("\n📦 Migrating inventories...", "blue");

  const inventories = sqliteDb.prepare("SELECT * FROM inventories").all();
  log(`Found ${inventories.length} inventory records in SQLite`, "yellow");

  for (const inventory of inventories) {
    const { error } = await supabase.from("inventories").upsert(
      {
        id: inventory.id,
        fish_id: inventory.fish_id,
        quantity: inventory.quantity,
        location: inventory.location,
        updated_at: inventory.updated_at,
      },
      { onConflict: "id" },
    );

    if (error) {
      log(
        `❌ Error migrating inventory for fish_id ${inventory.fish_id}: ${error.message}`,
        "red",
      );
    } else {
      log(
        `✅ Migrated inventory: fish_id=${inventory.fish_id}, qty=${inventory.quantity}`,
        "green",
      );
    }
  }
}

async function migrateInventoryLogs() {
  log("\n📝 Migrating inventory logs...", "blue");

  const logs = sqliteDb
    .prepare("SELECT * FROM inventory_logs ORDER BY created_at")
    .all();
  log(`Found ${logs.length} inventory log records in SQLite`, "yellow");

  for (const log_item of logs) {
    const { error } = await supabase.from("inventory_logs").insert({
      fish_id: log_item.fish_id,
      type: log_item.type,
      quantity: log_item.quantity,
      reference_id: log_item.reference_id,
      reference_type: log_item.reference_type,
      notes: log_item.notes,
      created_by: log_item.created_by,
      created_at: log_item.created_at,
    });

    if (error) {
      log(`❌ Error migrating inventory log: ${error.message}`, "red");
    }
  }

  log(`✅ Migrated ${logs.length} inventory logs`, "green");
}

async function migrateImportOrders() {
  log("\n📥 Migrating import orders...", "blue");

  const orders = sqliteDb
    .prepare("SELECT * FROM import_orders ORDER BY created_at")
    .all();
  log(`Found ${orders.length} import orders in SQLite`, "yellow");

  for (const order of orders) {
    // Insert order
    const { error: orderError } = await supabase.from("import_orders").upsert(
      {
        id: order.id,
        order_number: order.order_number,
        supplier_id: order.supplier_id,
        order_date: order.order_date,
        expected_date: order.expected_date,
        delivery_date: order.delivery_date,
        status: order.status,
        total_amount: order.total_amount,
        paid_amount: order.paid_amount,
        payment_status: order.payment_status,
        notes: order.notes,
        created_by: order.created_by,
        created_at: order.created_at,
        updated_at: order.updated_at,
      },
      { onConflict: "id" },
    );

    if (orderError) {
      log(
        `❌ Error migrating import order ${order.order_number}: ${orderError.message}`,
        "red",
      );
      continue;
    }

    // Insert order items
    const items = sqliteDb
      .prepare("SELECT * FROM import_order_items WHERE import_order_id = ?")
      .all(order.id);

    for (const item of items) {
      const { error: itemError } = await supabase
        .from("import_order_items")
        .upsert(
          {
            id: item.id,
            import_order_id: item.import_order_id,
            fish_id: item.fish_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
          },
          { onConflict: "id" },
        );

      if (itemError) {
        log(
          `❌ Error migrating import order item: ${itemError.message}`,
          "red",
        );
      }
    }

    log(
      `✅ Migrated import order: ${order.order_number} with ${items.length} items`,
      "green",
    );
  }
}

async function migrateSaleOrders() {
  log("\n📤 Migrating sale orders...", "blue");

  const orders = sqliteDb
    .prepare("SELECT * FROM sale_orders ORDER BY created_at")
    .all();
  log(`Found ${orders.length} sale orders in SQLite`, "yellow");

  for (const order of orders) {
    // Insert order
    const { error: orderError } = await supabase.from("sale_orders").upsert(
      {
        id: order.id,
        order_number: order.order_number,
        customer_id: order.customer_id,
        order_date: order.order_date,
        delivery_date: order.delivery_date,
        status: order.status,
        total_amount: order.total_amount,
        paid_amount: order.paid_amount,
        payment_status: order.payment_status,
        notes: order.notes,
        created_by: order.created_by,
        created_at: order.created_at,
        updated_at: order.updated_at,
      },
      { onConflict: "id" },
    );

    if (orderError) {
      log(
        `❌ Error migrating sale order ${order.order_number}: ${orderError.message}`,
        "red",
      );
      continue;
    }

    // Insert order items
    const items = sqliteDb
      .prepare("SELECT * FROM sale_order_items WHERE sale_order_id = ?")
      .all(order.id);

    for (const item of items) {
      const { error: itemError } = await supabase
        .from("sale_order_items")
        .upsert(
          {
            id: item.id,
            sale_order_id: item.sale_order_id,
            fish_id: item.fish_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.total_price,
          },
          { onConflict: "id" },
        );

      if (itemError) {
        log(`❌ Error migrating sale order item: ${itemError.message}`, "red");
      }
    }

    log(
      `✅ Migrated sale order: ${order.order_number} with ${items.length} items`,
      "green",
    );
  }
}

// Main migration function
async function migrate() {
  log("🚀 Starting SQLite to Supabase migration...", "blue");
  log("=".repeat(60), "blue");

  try {
    // Migrate in order to respect foreign key constraints
    await migrateRoles();
    await migrateUsers();
    await migrateSuppliers();
    await migrateCustomers();
    await migrateCategories();
    await migrateFishes();
    await migrateInventories();
    await migrateInventoryLogs();
    await migrateImportOrders();
    await migrateSaleOrders();

    log("\n" + "=".repeat(60), "green");
    log("✅ Migration completed successfully!", "green");
    log("=".repeat(60), "green");

    log("\n📝 Post-migration tasks:", "yellow");
    log("1. Update sequences in Supabase if needed", "yellow");
    log("2. Users need to reset passwords via Supabase Auth", "yellow");
    log("3. Verify data integrity", "yellow");
    log("4. Test all application features", "yellow");
  } catch (error) {
    log("\n❌ Migration failed:", "red");
    log(error.message, "red");
    console.error(error);
  } finally {
    sqliteDb.close();
  }
}

// Run migration
migrate();
