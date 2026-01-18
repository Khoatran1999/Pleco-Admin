/**
 * Customer Model - Supabase Version
 * Handles customer CRUD operations
 */

const supabase = require("../config/supabase");
const {
  executeQuery,
  applyPagination,
  softDelete,
} = require("../utils/supabase-query");

const Customer = {
  /**
   * Get all customers with pagination and filters
   */
  async getAll(filters = {}) {
    return executeQuery(async () => {
      let query = supabase.from("customers").select("*", { count: "exact" });

      // Apply active filter by default
      if (filters.is_active !== undefined) {
        query = query.eq("is_active", filters.is_active);
      } else {
        query = query.eq("is_active", true);
      }

      // Apply customer type filter
      if (filters.customer_type) {
        query = query.eq("customer_type", filters.customer_type);
      }

      // Apply search filter
      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`,
        );
      }

      // Apply sorting
      query = query.order("name", { ascending: true });

      // Apply pagination if provided
      if (filters.page && filters.limit) {
        query = applyPagination(query, filters.page, filters.limit);
      }

      return query;
    });
  },

  /**
   * Get customer by ID
   */
  async findById(id) {
    return executeQuery(async () => {
      const result = await supabase
        .from("customers")
        .select("*")
        .eq("id", id)
        .single();

      return result;
    });
  },

  /**
   * Create new customer
   */
  async create(customerData) {
    const { name, email, social, phone, address, customer_type } = customerData;

    return executeQuery(async () => {
      const result = await supabase
        .from("customers")
        .insert({
          name,
          email,
          social,
          phone,
          address,
          customer_type: customer_type || "retail",
          is_active: true,
        })
        .select()
        .single();

      return result;
    });
  },

  /**
   * Update customer
   */
  async update(id, customerData) {
    const { name, email, social, phone, address, customer_type, is_active } =
      customerData;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (social !== undefined) updateData.social = social;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (customer_type !== undefined) updateData.customer_type = customer_type;
    if (is_active !== undefined) updateData.is_active = is_active;

    return executeQuery(async () => {
      const result = await supabase
        .from("customers")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      return result;
    });
  },

  /**
   * Delete customer (soft delete)
   */
  async delete(id) {
    return softDelete(supabase, "customers", id);
  },

  /**
   * Get customer statistics
   */
  async getStats(customerId) {
    return executeQuery(async () => {
      // Get total sale orders
      const { count: totalOrders } = await supabase
        .from("sale_orders")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", customerId);

      // Get total amount
      const { data: orders } = await supabase
        .from("sale_orders")
        .select("total_amount")
        .eq("customer_id", customerId)
        .eq("status", "completed");

      const totalAmount =
        orders?.reduce(
          (sum, order) => sum + parseFloat(order.total_amount),
          0,
        ) || 0;

      // Get pending orders
      const { count: pendingOrders } = await supabase
        .from("sale_orders")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", customerId)
        .in("status", ["pending", "processing"]);

      return {
        data: {
          total_orders: totalOrders || 0,
          total_amount: totalAmount,
          pending_orders: pendingOrders || 0,
        },
      };
    });
  },

  /**
   * Get customer purchase history
   */
  async getPurchaseHistory(customerId, limit = 10) {
    return executeQuery(async () => {
      const result = await supabase
        .from("sale_orders")
        .select(
          `
          id,
          order_number,
          order_date,
          status,
          total_amount,
          payment_method
        `,
        )
        .eq("customer_id", customerId)
        .order("order_date", { ascending: false })
        .limit(limit);

      return result;
    });
  },
};

module.exports = Customer;
