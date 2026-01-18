/**
 * Create sample sale order items for testing
 */

const supabase = require("./src/config/supabase");

async function createSampleItems() {
  console.log("🌱 Creating sample sale order items...\n");

  try {
    // Get some completed orders
    const { data: orders } = await supabase
      .from("sale_orders")
      .select("id, order_number, total_amount")
      .eq("status", "completed")
      .limit(10);

    if (!orders || orders.length === 0) {
      console.log("❌ No completed orders found");
      return;
    }

    console.log(`Found ${orders.length} completed orders`);

    // Get some fishes
    const { data: fishes } = await supabase
      .from("fishes")
      .select("id, name, retail_price")
      .limit(20);

    if (!fishes || fishes.length === 0) {
      console.log("❌ No fishes found");
      return;
    }

    console.log(`Found ${fishes.length} fishes\n`);

    // Create items for each order
    const itemsToInsert = [];

    orders.forEach((order) => {
      // Add 1-3 random items per order
      const numItems = Math.floor(Math.random() * 3) + 1;
      let orderTotal = parseFloat(order.total_amount);

      for (let i = 0; i < numItems; i++) {
        const fish = fishes[Math.floor(Math.random() * fishes.length)];
        const quantity = Math.floor(Math.random() * 5) + 1;
        const pricePerUnit = parseFloat(fish.retail_price);
        const totalPrice = quantity * pricePerUnit;

        itemsToInsert.push({
          sale_order_id: order.id,
          fish_id: fish.id,
          quantity,
          unit_price: pricePerUnit,
          total_price: totalPrice,
        });
      }
    });

    console.log(`Inserting ${itemsToInsert.length} items...`);

    const { data, error } = await supabase
      .from("sale_order_items")
      .insert(itemsToInsert)
      .select();

    if (error) {
      console.error("❌ Error:", error);
      return;
    }

    console.log(`✅ Successfully created ${data.length} sale order items`);
    console.log("\n🎉 Sample data ready! You can now test the Reports page.");
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

createSampleItems()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
