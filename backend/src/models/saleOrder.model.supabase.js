/**
 * Sale Order Model - Supabase Version
 * Handles sale orders to customers
 */

const supabase = require("../config/supabase");
const { executeQuery, applyPagination } = require("../utils/supabase-query");
const { sanitizeForLike } = require("../utils/security");

const SaleOrder = {
  /**
   * Get all sale orders with details
   */
  async getAll(filters = {}) {
    return executeQuery(async () => {
      let query = supabase.from("sale_orders").select(
        `
          *,
          customers (
            id,
            name,
            customer_type,
            phone,
            email
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

      // Apply customer filter
      if (filters.customer_id) {
        query = query.eq("customer_id", filters.customer_id);
      }

      // Apply sale type filter
      if (filters.sale_type) {
        query = query.eq("sale_type", filters.sale_type);
      }

      // Apply date range filter
      if (filters.start_date) {
        query = query.gte("order_date", filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte("order_date", filters.end_date);
      }

      // Apply search
      if (filters.search) {
        const sanitizedSearch = sanitizeForLike(filters.search);
        query = query.ilike("order_number", `%${sanitizedSearch}%`);
      }

      // Apply sorting
      query = query.order("order_date", { ascending: false });

      // Apply pagination
      if (filters.page && filters.limit) {
        query = applyPagination(query, filters.page, filters.limit);
      }

      return query;
    });
  },

  /**
   * Get sale order by ID with items
   */
  async findById(id) {
    return executeQuery(async () => {
      // Get order details
      const { data: order, error: orderError } = await supabase
        .from("sale_orders")
        .select(
          `
          *,
          customers (
            id,
            name,
            customer_type,
            phone,
            email,
            address
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
        .from("sale_order_items")
        .select(
          `
          *,
          fishes (
            id,
            sku,
            name,
            size,
            unit,
            image,
            retail_price,
            wholesale_price
          )
        `,
        )
        .eq("sale_order_id", id);

      if (itemsError) throw itemsError;

      return {
        data: {
          ...order,
          items,
        },
      };
    });
  },

  /**
   * Create new sale order with items
   */
  async create(orderData, userId) {
    const {
      order_number,
      customer_id,
      sale_type,
      order_date,
      payment_method,
      discount_amount,
      notes,
      items,
    } = orderData;

    return executeQuery(async () => {
      // Validate inventory availability
      for (const item of items) {
        const { data: inventory } = await supabase
          .from("inventories")
          .select("quantity")
          .eq("fish_id", item.fish_id)
          .single();

        const available = inventory?.quantity || 0;
        if (available < parseFloat(item.quantity)) {
          const { data: fish } = await supabase
            .from("fishes")
            .select("name")
            .eq("id", item.fish_id)
            .single();

          throw new Error(
            `Insufficient stock for ${fish?.name}. Available: ${available}`,
          );
        }
      }

      // Calculate amounts
      const subtotal = items.reduce((sum, item) => {
        return sum + parseFloat(item.quantity) * parseFloat(item.unit_price);
      }, 0);

      const totalAmount = subtotal - (parseFloat(discount_amount) || 0);

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("sale_orders")
        .insert({
          order_number,
          customer_id,
          sale_type: sale_type || "retail",
          order_date: order_date || new Date().toISOString(),
          status: "pending",
          subtotal,
          discount_amount: parseFloat(discount_amount) || 0,
          total_amount: totalAmount,
          payment_method,
          notes,
          created_by: userId,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map((item) => ({
        sale_order_id: order.id,
        fish_id: item.fish_id,
        quantity: parseFloat(item.quantity),
        unit_price: parseFloat(item.unit_price),
        total_price: parseFloat(item.quantity) * parseFloat(item.unit_price),
      }));

      const { error: itemsError } = await supabase
        .from("sale_order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      return { data: order };
    });
  },

  /**
   * Update sale order
   */
  async update(id, orderData) {
    const {
      customer_id,
      sale_type,
      order_date,
      status,
      payment_method,
      discount_amount,
      notes,
      items,
    } = orderData;

    return executeQuery(async () => {
      const updateData = {};
      if (customer_id !== undefined) updateData.customer_id = customer_id;
      if (sale_type !== undefined) updateData.sale_type = sale_type;
      if (order_date !== undefined) updateData.order_date = order_date;
      if (status !== undefined) updateData.status = status;
      if (payment_method !== undefined)
        updateData.payment_method = payment_method;
      if (notes !== undefined) updateData.notes = notes;

      // Recalculate amounts if items or discount changed
      if (items || discount_amount !== undefined) {
        let subtotal;

        if (items) {
          subtotal = items.reduce((sum, item) => {
            return (
              sum + parseFloat(item.quantity) * parseFloat(item.unit_price)
            );
          }, 0);

          // Delete existing items and insert new ones
          await supabase
            .from("sale_order_items")
            .delete()
            .eq("sale_order_id", id);

          const orderItems = items.map((item) => ({
            sale_order_id: id,
            fish_id: item.fish_id,
            quantity: parseFloat(item.quantity),
            unit_price: parseFloat(item.unit_price),
            total_price:
              parseFloat(item.quantity) * parseFloat(item.unit_price),
          }));

          await supabase.from("sale_order_items").insert(orderItems);

          updateData.subtotal = subtotal;
        } else {
          // Get current subtotal
          const { data: currentOrder } = await supabase
            .from("sale_orders")
            .select("subtotal")
            .eq("id", id)
            .single();

          subtotal = currentOrder?.subtotal || 0;
        }

        const discount = parseFloat(discount_amount) || 0;
        updateData.discount_amount = discount;
        updateData.total_amount = subtotal - discount;
      }

      // Update order
      const { data: order, error } = await supabase
        .from("sale_orders")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return { data: order };
    });
  },

  /**
   * Process sale order (update inventory)
   */
  async process(id, userId) {
    return executeQuery(async () => {
      // Get order items
      const { data: items } = await supabase
        .from("sale_order_items")
        .select("*")
        .eq("sale_order_id", id);

      // Update inventory for each item
      for (const item of items) {
        // Get current inventory
        const { data: currentInv } = await supabase
          .from("inventories")
          .select("quantity")
          .eq("fish_id", item.fish_id)
          .single();

        const quantityBefore = currentInv?.quantity || 0;
        const quantityAfter = quantityBefore - parseFloat(item.quantity);

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
          .eq("fish_id", item.fish_id);

        // Create inventory log
        await supabase.from("inventory_logs").insert({
          fish_id: item.fish_id,
          type: "sale",
          quantity_change: -parseFloat(item.quantity),
          quantity_before: quantityBefore,
          quantity_after: quantityAfter,
          reference_type: "sale_order",
          reference_id: id,
          created_by: userId,
        });
      }

      // Update order status to processing
      const { data: order } = await supabase
        .from("sale_orders")
        .update({ status: "processing" })
        .eq("id", id)
        .select()
        .single();

      return { data: order };
    });
  },

  /**
   * Complete sale order
   */
  async complete(id) {
    return executeQuery(async () => {
      const { data: order } = await supabase
        .from("sale_orders")
        .update({ status: "completed" })
        .eq("id", id)
        .select()
        .single();

      return { data: order };
    });
  },

  /**
   * Update order status
   */
  async updateStatus(id, status, userId) {
    return executeQuery(async () => {
      const { data: order, error } = await supabase
        .from("sale_orders")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return { data: order };
    });
  },

  /**
   * Cancel sale order and restore inventory
   */
  async cancel(id, userId) {
    return executeQuery(async () => {
      // Get current order status
      const { data: currentOrder } = await supabase
        .from("sale_orders")
        .select("status")
        .eq("id", id)
        .single();

      // If order was processed, restore inventory
      if (
        currentOrder?.status === "processing" ||
        currentOrder?.status === "completed"
      ) {
        const { data: items } = await supabase
          .from("sale_order_items")
          .select("*")
          .eq("sale_order_id", id);

        for (const item of items) {
          const { data: currentInv } = await supabase
            .from("inventories")
            .select("quantity")
            .eq("fish_id", item.fish_id)
            .single();

          const quantityBefore = currentInv?.quantity || 0;
          const quantityAfter = quantityBefore + parseFloat(item.quantity);

          await supabase
            .from("inventories")
            .update({
              quantity: quantityAfter,
              last_updated: new Date().toISOString(),
            })
            .eq("fish_id", item.fish_id);

          await supabase.from("inventory_logs").insert({
            fish_id: item.fish_id,
            type: "adjustment",
            quantity_change: parseFloat(item.quantity),
            quantity_before: quantityBefore,
            quantity_after: quantityAfter,
            reference_type: "sale_order_cancelled",
            reference_id: id,
            note: "Order cancelled - inventory restored",
            created_by: userId,
          });
        }
      }

      // Update order status
      const { data: order } = await supabase
        .from("sale_orders")
        .update({ status: "cancelled" })
        .eq("id", id)
        .select()
        .single();

      return { data: order };
    });
  },

  /**
   * Delete sale order
   */
  async delete(id) {
    return executeQuery(async () => {
      // Items will be deleted via CASCADE
      const { error } = await supabase
        .from("sale_orders")
        .delete()
        .eq("id", id);

      if (error) throw error;

      return { data: { success: true } };
    });
  },

  /**
   * Get sale order statistics
   */
  async getStats(filters = {}) {
    return executeQuery(async () => {
      let query = supabase
        .from("sale_orders")
        .select("status, total_amount, sale_type");

      if (filters.start_date) {
        query = query.gte("order_date", filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte("order_date", filters.end_date);
      }

      const { data: orders } = await query;

      const stats = {
        total_orders: orders?.length || 0,
        pending: 0,
        processing: 0,
        completed: 0,
        cancelled: 0,
        total_revenue: 0,
        retail_revenue: 0,
        wholesale_revenue: 0,
      };

      orders?.forEach((order) => {
        stats[order.status]++;
        if (order.status === "completed") {
          const amount = parseFloat(order.total_amount);
          stats.total_revenue += amount;

          if (order.sale_type === "retail") {
            stats.retail_revenue += amount;
          } else {
            stats.wholesale_revenue += amount;
          }
        }
      });

      return { data: stats };
    });
  },
};

module.exports = SaleOrder;
