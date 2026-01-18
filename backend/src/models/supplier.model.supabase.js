/**
 * Supplier Model - Supabase Version
 * Handles supplier CRUD operations
 */

const supabase = require("../config/supabase");
const {
  executeQuery,
  applyFilters,
  applyPagination,
  softDelete,
} = require("../utils/supabase-query");

const Supplier = {
  /**
   * Get all suppliers with pagination and filters
   */
  async getAll(filters = {}) {
    return executeQuery(async () => {
      let query = supabase.from("suppliers").select("*", { count: "exact" });

      // Apply active filter by default
      if (filters.is_active !== undefined) {
        query = query.eq("is_active", filters.is_active);
      } else {
        query = query.eq("is_active", true);
      }

      // Apply search filter
      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,contact_person.ilike.%${filters.search}%,email.ilike.%${filters.search}%`,
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
   * Get supplier by ID
   */
  async findById(id) {
    return executeQuery(async () => {
      const result = await supabase
        .from("suppliers")
        .select("*")
        .eq("id", id)
        .single();

      return result;
    });
  },

  /**
   * Create new supplier
   */
  async create(supplierData) {
    const { name, contact_person, email, phone, address, avatar } =
      supplierData;

    return executeQuery(async () => {
      const result = await supabase
        .from("suppliers")
        .insert({
          name,
          contact_person,
          email,
          phone,
          address,
          avatar,
          is_active: true,
        })
        .select()
        .single();

      return result;
    });
  },

  /**
   * Update supplier
   */
  async update(id, supplierData) {
    const { name, contact_person, email, phone, address, avatar, is_active } =
      supplierData;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (contact_person !== undefined)
      updateData.contact_person = contact_person;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (is_active !== undefined) updateData.is_active = is_active;

    return executeQuery(async () => {
      const result = await supabase
        .from("suppliers")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      return result;
    });
  },

  /**
   * Delete supplier (soft delete)
   */
  async delete(id) {
    return softDelete(supabase, "suppliers", id);
  },

  /**
   * Upload supplier avatar
   */
  async uploadAvatar(supplierId, file) {
    const fileName = `supplier-${supplierId}-${Date.now()}${file.originalname}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("suppliers")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) throw error;

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("suppliers").getPublicUrl(fileName);

    // Update supplier record
    await this.update(supplierId, { avatar: publicUrl });

    return publicUrl;
  },

  /**
   * Get supplier statistics
   */
  async getStats(supplierId) {
    return executeQuery(async () => {
      // Get total import orders
      const { count: totalOrders } = await supabase
        .from("import_orders")
        .select("*", { count: "exact", head: true })
        .eq("supplier_id", supplierId);

      // Get total amount
      const { data: orders } = await supabase
        .from("import_orders")
        .select("total_amount")
        .eq("supplier_id", supplierId)
        .eq("status", "delivered");

      const totalAmount =
        orders?.reduce(
          (sum, order) => sum + parseFloat(order.total_amount),
          0,
        ) || 0;

      // Get pending orders
      const { count: pendingOrders } = await supabase
        .from("import_orders")
        .select("*", { count: "exact", head: true })
        .eq("supplier_id", supplierId)
        .eq("status", "pending");

      return {
        data: {
          total_orders: totalOrders || 0,
          total_amount: totalAmount,
          pending_orders: pendingOrders || 0,
        },
      };
    });
  },
};

module.exports = Supplier;
