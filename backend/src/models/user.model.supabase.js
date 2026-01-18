/**
 * User Model - Supabase Version
 * Handles user CRUD operations with Supabase Auth integration
 */

const supabase = require("../config/supabase");
const { executeQuery, applyPagination } = require("../utils/supabase-query");
const { sanitizeForPostgrest, sanitizeForLike } = require("../utils/security");

const User = {
  /**
   * Find user by username or email (for login)
   */
  async findByUsername(username) {
    return executeQuery(async () => {
      // Sanitize input to prevent PostgREST filter injection
      const sanitizedUsername = sanitizeForPostgrest(username);

      const result = await supabase
        .from("users")
        .select(
          `
          *,
          roles (
            id,
            name,
            description
          )
        `,
        )
        .or(
          `username.eq."${sanitizedUsername}",email.eq."${sanitizedUsername}"`,
        )
        .single();

      return result;
    });
  },

  /**
   * Find user by email
   */
  async findByEmail(email) {
    return executeQuery(async () => {
      const result = await supabase
        .from("users")
        .select(
          `
          *,
          roles (
            id,
            name,
            description
          )
        `,
        )
        .eq("email", email)
        .single();

      return result;
    });
  },

  /**
   * Find user by ID
   */
  async findById(id) {
    return executeQuery(async () => {
      const result = await supabase
        .from("users")
        .select(
          `
          id,
          username,
          email,
          full_name,
          is_active,
          created_at,
          roles (
            id,
            name,
            description
          )
        `,
        )
        .eq("id", id)
        .single();

      return result;
    });
  },

  /**
   * Get all users
   */
  async getAll(filters = {}) {
    return executeQuery(async () => {
      let query = supabase.from("users").select(
        `
          id,
          username,
          email,
          full_name,
          is_active,
          created_at,
          roles (
            id,
            name,
            description
          )
        `,
        { count: "exact" },
      );

      // Apply active filter
      if (filters.is_active !== undefined) {
        query = query.eq("is_active", filters.is_active);
      }

      // Apply role filter
      if (filters.role_id) {
        query = query.eq("role_id", filters.role_id);
      }

      // Apply search
      if (filters.search) {
        const s = sanitizeForLike(filters.search);
        query = query.or(
          `username.ilike.%${s}%,email.ilike.%${s}%,full_name.ilike.%${s}%`,
        );
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
   * Create new user (in database only, Auth user should exist)
   */
  async create(userData) {
    const { username, email, full_name, role_id } = userData;

    return executeQuery(async () => {
      const result = await supabase
        .from("users")
        .insert({
          username,
          email,
          full_name,
          role_id: role_id || 3, // Default to staff role
          password: "managed_by_supabase_auth",
          is_active: true,
        })
        .select(
          `
          id,
          username,
          email,
          full_name,
          is_active,
          created_at,
          roles (
            id,
            name,
            description
          )
        `,
        )
        .single();

      return result;
    });
  },

  /**
   * Update user
   */
  async update(id, userData) {
    const { full_name, role_id, is_active } = userData;

    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (role_id !== undefined) updateData.role_id = role_id;
    if (is_active !== undefined) updateData.is_active = is_active;

    return executeQuery(async () => {
      const result = await supabase
        .from("users")
        .update(updateData)
        .eq("id", id)
        .select(
          `
          id,
          username,
          email,
          full_name,
          is_active,
          created_at,
          roles (
            id,
            name,
            description
          )
        `,
        )
        .single();

      return result;
    });
  },

  /**
   * Deactivate user
   */
  async deactivate(id) {
    return this.update(id, { is_active: false });
  },

  /**
   * Activate user
   */
  async activate(id) {
    return this.update(id, { is_active: true });
  },

  /**
   * Get all roles
   */
  async getRoles() {
    return executeQuery(async () => {
      const result = await supabase.from("roles").select("*").order("id");

      return result;
    });
  },

  /**
   * Get user statistics
   */
  async getStats(userId) {
    return executeQuery(async () => {
      // Get total orders created by user
      const { count: importOrders } = await supabase
        .from("import_orders")
        .select("*", { count: "exact", head: true })
        .eq("created_by", userId);

      const { count: saleOrders } = await supabase
        .from("sale_orders")
        .select("*", { count: "exact", head: true })
        .eq("created_by", userId);

      // Get inventory logs by user
      const { count: inventoryLogs } = await supabase
        .from("inventory_logs")
        .select("*", { count: "exact", head: true })
        .eq("created_by", userId);

      return {
        data: {
          import_orders: importOrders || 0,
          sale_orders: saleOrders || 0,
          inventory_logs: inventoryLogs || 0,
        },
      };
    });
  },
};

module.exports = User;
