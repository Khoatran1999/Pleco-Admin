/**
 * Inventory Model - Supabase Version
 * Handles inventory management and tracking
 */

const supabase = require("../config/supabase");
const { executeQuery } = require("../utils/supabase-query");

const Inventory = {
  /**
   * Get all inventory with fish details
   */
  async getAll(filters = {}) {
    return executeQuery(async () => {
      let query = supabase.from("inventories").select(`
          *,
          fishes (
            id,
            sku,
            name,
            size,
            min_stock,
            unit,
            retail_price,
            wholesale_price,
            image,
            fish_categories (name)
          )
        `);

      // Apply filters
      if (filters.fish_id) {
        query = query.eq("fish_id", filters.fish_id);
      }

      query = query.order("last_updated", { ascending: false });

      const result = await query;

      // Add status calculation
      if (result.data) {
        result.data = result.data.map((inv) => {
          const minStock = inv.fishes?.min_stock || 10;
          let status = "Out of Stock";

          if (inv.quantity > 0 && inv.quantity <= minStock) {
            status = "Low Stock";
          } else if (inv.quantity > minStock) {
            status = "In Stock";
          }

          return {
            ...inv,
            status,
            fish_name: inv.fishes?.name,
            sku: inv.fishes?.sku,
            fish_sku: inv.fishes?.sku,
            size: inv.fishes?.size,
            min_stock: inv.fishes?.min_stock,
            retail_price: inv.fishes?.retail_price,
            wholesale_price: inv.fishes?.wholesale_price,
            category_name: inv.fishes?.fish_categories?.name,
          };
        });
      }

      return result;
    });
  },

  /**
   * Get inventory by fish ID
   */
  async getByFishId(fishId) {
    return executeQuery(async () => {
      const result = await supabase
        .from("inventories")
        .select(
          `
          *,
          fishes (
            id,
            sku,
            name,
            size,
            min_stock,
            unit,
            retail_price,
            wholesale_price,
            image
          )
        `,
        )
        .eq("fish_id", fishId)
        .single();

      return result;
    });
  },

  /**
   * Update inventory quantity
   */
  async updateQuantity(
    fishId,
    newQuantity,
    type,
    reference,
    userId,
    note = "",
  ) {
    return executeQuery(async () => {
      // Get current inventory
      const { data: currentInv } = await supabase
        .from("inventories")
        .select("quantity")
        .eq("fish_id", fishId)
        .single();

      const quantityBefore = currentInv?.quantity || 0;
      const quantityAfter = parseFloat(newQuantity);
      const quantityChange = quantityAfter - quantityBefore;

      // Update inventory
      const { data: inventory, error: invError } = await supabase
        .from("inventories")
        .upsert(
          {
            fish_id: fishId,
            quantity: quantityAfter,
            last_updated: new Date().toISOString(),
          },
          {
            onConflict: "fish_id",
          },
        )
        .select()
        .single();

      if (invError) throw invError;

      // Create log entry
      const logData = {
        fish_id: fishId,
        type,
        quantity_change: quantityChange,
        quantity_before: quantityBefore,
        quantity_after: quantityAfter,
        note,
        created_by: userId,
      };

      if (reference) {
        logData.reference_type = reference.type;
        logData.reference_id = reference.id;
      }

      await supabase.from("inventory_logs").insert(logData);

      return { data: inventory };
    });
  },

  /**
   * Adjust inventory (manual adjustment)
   */
  async adjust(fishId, quantity, reason, userId) {
    return this.updateQuantity(
      fishId,
      quantity,
      "adjustment",
      null,
      userId,
      reason,
    );
  },

  /**
   * Record loss
   */
  async recordLoss(fishId, lossQuantity, reason, userId) {
    return executeQuery(async () => {
      // Get current inventory
      const { data: currentInv } = await supabase
        .from("inventories")
        .select("quantity")
        .eq("fish_id", fishId)
        .single();

      const quantityBefore = currentInv?.quantity || 0;
      const quantityAfter = quantityBefore - parseFloat(lossQuantity);

      if (quantityAfter < 0) {
        throw new Error("Insufficient inventory");
      }

      // Update inventory
      await supabase
        .from("inventories")
        .update({
          quantity: quantityAfter,
          last_updated: new Date().toISOString(),
        })
        .eq("fish_id", fishId);

      // Create log entry
      await supabase.from("inventory_logs").insert({
        fish_id: fishId,
        type: "loss",
        quantity_change: -parseFloat(lossQuantity),
        quantity_before: quantityBefore,
        quantity_after: quantityAfter,
        loss_reason: reason,
        note: reason,
        created_by: userId,
      });

      return { data: { success: true } };
    });
  },

  /**
   * Get inventory logs
   */
  async getLogs(filters = {}) {
    return executeQuery(async () => {
      let query = supabase.from("inventory_logs").select(`
          *,
          fishes (
            id,
            sku,
            name,
            size
          ),
          users:created_by (
            id,
            username,
            full_name
          )
        `);

      // Apply filters
      if (filters.fish_id) {
        query = query.eq("fish_id", filters.fish_id);
      }

      if (filters.type) {
        query = query.eq("type", filters.type);
      }

      if (filters.start_date) {
        query = query.gte("created_at", filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte("created_at", filters.end_date);
      }

      // Apply sorting
      query = query.order("created_at", { ascending: false });

      // Apply limit
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const result = await query;

      // Flatten results to include fish and user info directly
      if (result.data) {
        result.data = result.data.map((log) => ({
          ...log,
          fish_name: log.fishes?.name || null,
          sku: log.fishes?.sku || null,
          fish_size: log.fishes?.size || null,
          created_by_name: log.users?.full_name || log.users?.username || null,
        }));
      }

      return result;
    });
  },

  /**
   * Get inventory summary statistics
   */
  async getSummary() {
    return executeQuery(async () => {
      // Get all inventories with fish info
      const { data: inventories } = await supabase.from("inventories").select(`
          quantity,
          fishes (
            min_stock,
            retail_price,
            cost_price
          )
        `);

      let totalItems = 0;
      let totalValue = 0;
      let totalCost = 0;
      let lowStockCount = 0;
      let outOfStockCount = 0;

      inventories?.forEach((inv) => {
        const qty = inv.quantity || 0;
        const minStock = inv.fishes?.min_stock || 10;
        const retailPrice = parseFloat(inv.fishes?.retail_price) || 0;
        const costPrice = parseFloat(inv.fishes?.cost_price) || 0;

        totalItems += qty;
        totalValue += qty * retailPrice;
        totalCost += qty * costPrice;

        if (qty === 0) {
          outOfStockCount++;
        } else if (qty <= minStock) {
          lowStockCount++;
        }
      });

      return {
        data: {
          total_items: totalItems,
          total_value: totalValue,
          total_cost: totalCost,
          low_stock_count: lowStockCount,
          out_of_stock_count: outOfStockCount,
          total_products: inventories?.length || 0,
        },
      };
    });
  },

  /**
   * Subscribe to inventory changes (for real-time updates)
   */
  subscribeToChanges(callback) {
    return supabase
      .channel("inventory-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inventories",
        },
        callback,
      )
      .subscribe();
  },
};

module.exports = Inventory;
