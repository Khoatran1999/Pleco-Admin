/**
 * Import Order Model - Supabase Version
 * Handles import orders from suppliers
 */

const supabase = require("../config/supabase");
const { executeQuery, applyPagination } = require("../utils/supabase-query");
const { sanitizeForLike } = require("../utils/security");

const ImportOrder = {
  /**
   * Get all import orders with details
   */
  async getAll(filters = {}) {
    return executeQuery(async () => {
      let query = supabase.from("import_orders").select(
        `
          *,
          suppliers (
            id,
            name,
            contact_person
          ),
          users:created_by (
            id,
            username,
            full_name
          )
        `,
        { count: "exact" },
      );

      // Apply status filter
      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      // Apply supplier filter
      if (filters.supplier_id) {
        query = query.eq("supplier_id", filters.supplier_id);
      }

      // Apply date range filter
      if (filters.start_date) {
        query = query.gte("created_at", filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte("created_at", filters.end_date);
      }

      // Apply search
      if (filters.search) {
        const sanitizedSearch = sanitizeForLike(filters.search);
        query = query.ilike("order_number", `%${sanitizedSearch}%`);
      }

      // Apply sorting
      query = query.order("created_at", { ascending: false });

      // Apply pagination
      if (filters.page && filters.limit) {
        query = applyPagination(query, filters.page, filters.limit);
      }

      return query;
    });
  },

  /**
   * Get import order by ID with items
   */
  async findById(id) {
    return executeQuery(async () => {
      // Get order details
      const { data: order, error: orderError } = await supabase
        .from("import_orders")
        .select(
          `
          *,
          suppliers (
            id,
            name,
            contact_person,
            phone,
            email
          ),
          users:created_by (
            id,
            username,
            full_name
          )
        `,
        )
        .eq("id", id)
        .single();

      if (orderError) throw orderError;

      // Get order items
      const { data: items, error: itemsError } = await supabase
        .from("import_order_items")
        .select(
          `
          *,
          fishes (
            id,
            sku,
            name,
            size,
            unit,
            image
          )
        `,
        )
        .eq("import_order_id", id);

      if (itemsError) throw itemsError;

      // Flatten items to include fish info directly
      const flattenedItems = items?.map((item) => ({
        ...item,
        fish_name: item.fishes?.name || null,
        sku: item.fishes?.sku || null,
        fish_size: item.fishes?.size || null,
        fish_unit: item.fishes?.unit || null,
        fish_image: item.fishes?.image || null,
      }));

      return {
        data: {
          ...order,
          items: flattenedItems,
        },
      };
    });
  },

  /**
   * Create new import order with items
   */
  async create(orderData, userId) {
    const { supplier_id, expected_delivery, delivery_date, notes, items } =
      orderData;

    // Generate order number if not provided
    const randomSuffix = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
    const order_number =
      orderData.order_number || `IO-${Date.now()}-${randomSuffix}`;

    return executeQuery(async () => {
      // Calculate total amount
      const totalAmount = items.reduce((sum, item) => {
        return sum + parseFloat(item.quantity) * parseFloat(item.unit_price);
      }, 0);

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("import_orders")
        .insert({
          order_number,
          supplier_id,
          expected_delivery,
          delivery_date,
          status: "pending",
          total_amount: totalAmount,
          notes,
          created_by: userId,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map((item) => ({
        import_order_id: order.id,
        fish_id: item.fish_id,
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.unit_price),
        total_price: parseFloat(item.quantity) * parseFloat(item.unit_price),
        batch_id: item.batch_id,
      }));

      const { error: itemsError } = await supabase
        .from("import_order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return { data: order };
    });
  },

  /**
   * Update import order
   */
  async update(id, orderData, userId) {
    const {
      supplier_id,
      expected_delivery,
      delivery_date,
      status,
      notes,
      items,
    } = orderData;

    return executeQuery(async () => {
      const updateData = {};
      if (supplier_id !== undefined) updateData.supplier_id = supplier_id;
      if (expected_delivery !== undefined)
        updateData.expected_delivery = expected_delivery;
      if (delivery_date !== undefined) updateData.delivery_date = delivery_date;
      if (status !== undefined) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;

      // Recalculate total if items provided
      if (items) {
        const totalAmount = items.reduce((sum, item) => {
          return sum + parseFloat(item.quantity) * parseFloat(item.unit_price);
        }, 0);
        updateData.total_amount = totalAmount;

        // Delete existing items and insert new ones
        await supabase
          .from("import_order_items")
          .delete()
          .eq("import_order_id", id);

        const orderItems = items.map((item) => ({
          import_order_id: id,
          fish_id: item.fish_id,
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.unit_price),
          total_price: parseFloat(item.quantity) * parseFloat(item.unit_price),
          batch_id: item.batch_id,
        }));

        await supabase.from("import_order_items").insert(orderItems);
      }

      // Update order
      const { data: order, error } = await supabase
        .from("import_orders")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return { data: order };
    });
  },

  /**
   * Confirm import order and update inventory
   */
  async confirm(id, userId) {
    return executeQuery(async () => {
      // Get order items
      const { data: items } = await supabase
        .from("import_order_items")
        .select("*")
        .eq("import_order_id", id);

      // Update inventory for each item
      for (const item of items) {
        // Get current inventory
        const { data: currentInv } = await supabase
          .from("inventories")
          .select("quantity")
          .eq("fish_id", item.fish_id)
          .single();

        const quantityBefore = currentInv?.quantity || 0;
        const quantityAfter = quantityBefore + parseFloat(item.quantity);

        // Update inventory
        await supabase.from("inventories").upsert(
          {
            fish_id: item.fish_id,
            quantity: quantityAfter,
            last_updated: new Date().toISOString(),
          },
          {
            onConflict: "fish_id",
          },
        );

        // Create inventory log
        await supabase.from("inventory_logs").insert({
          fish_id: item.fish_id,
          type: "import",
          quantity_change: parseFloat(item.quantity),
          quantity_before: quantityBefore,
          quantity_after: quantityAfter,
          reference_type: "import_order",
          reference_id: id,
          created_by: userId,
        });
      }

      // Update order status to confirmed
      const { data: order } = await supabase
        .from("import_orders")
        .update({ status: "confirmed" })
        .eq("id", id)
        .select()
        .single();

      return { data: order };
    });
  },

  /**
   * Deliver import order
   */
  async deliver(id, deliveryDate = null) {
    return executeQuery(async () => {
      const { data: order } = await supabase
        .from("import_orders")
        .update({
          status: "delivered",
          delivery_date: deliveryDate || new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      return { data: order };
    });
  },

  /**
   * Cancel import order
   */
  async cancel(id) {
    return executeQuery(async () => {
      const { data: order } = await supabase
        .from("import_orders")
        .update({ status: "cancelled" })
        .eq("id", id)
        .select()
        .single();

      return { data: order };
    });
  },

  /**
   * Delete import order
   */
  async delete(id) {
    return executeQuery(async () => {
      // Items will be deleted via CASCADE
      const { error } = await supabase
        .from("import_orders")
        .delete()
        .eq("id", id);

      if (error) throw error;

      return { data: { success: true } };
    });
  },

  /**
   * Get import order statistics
   */
  async getStats(filters = {}) {
    return executeQuery(async () => {
      let query = supabase.from("import_orders").select("status, total_amount");

      if (filters.start_date) {
        query = query.gte("created_at", filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte("created_at", filters.end_date);
      }

      const { data: orders } = await query;

      const stats = {
        total_orders: orders?.length || 0,
        pending: 0,
        confirmed: 0,
        delivered: 0,
        cancelled: 0,
        total_amount: 0,
      };

      orders?.forEach((order) => {
        stats[order.status]++;
        if (order.status === "delivered") {
          stats.total_amount += parseFloat(order.total_amount);
        }
      });

      return { data: stats };
    });
  },
};

module.exports = ImportOrder;
