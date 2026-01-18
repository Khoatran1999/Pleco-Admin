/**
 * Debug Sales by Species
 */

const supabase = require("./src/config/supabase");

async function debugSpeciesSales() {
  console.log("🔍 Debugging Sales by Species...\n");

  try {
    // Check sale_order_items with joins
    console.log("1️⃣ Checking sale_order_items...");
    const { data: items, error } = await supabase
      .from("sale_order_items")
      .select(
        `
        quantity,
        total_price,
        sale_orders!inner (status, order_number),
        fishes!inner (
          name,
          fish_categories (id, name)
        )
      `,
      )
      .eq("sale_orders.status", "completed")
      .limit(5);

    if (error) {
      console.error("❌ Query error:", error);
      return;
    }

    console.log(`Found ${items?.length || 0} items`);
    console.log("Sample items:", JSON.stringify(items, null, 2));
    console.log();

    // Check if fish_categories exist
    console.log("2️⃣ Checking fish_categories...");
    const { data: categories } = await supabase
      .from("fish_categories")
      .select("*");
    console.log("Categories:", categories);
    console.log();

    // Check fishes with categories
    console.log("3️⃣ Checking fishes with categories...");
    const { data: fishes } = await supabase
      .from("fishes")
      .select(
        `
        id,
        name,
        category_id,
        fish_categories (id, name)
      `,
      )
      .limit(5);
    console.log("Fishes:", JSON.stringify(fishes, null, 2));
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

debugSpeciesSales()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
