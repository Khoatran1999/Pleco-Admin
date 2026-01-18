/**
 * Category Model - Supabase Version
 * Handles fish categories CRUD operations
 */

const supabase = require("../config/supabase");
const {
  executeQuery,
  applyFilters,
  softDelete,
} = require("../utils/supabase-query");

const Category = {
  /**
   * Get all categories
   */
  async getAll(filters = {}) {
    return executeQuery(async () => {
      let query = supabase
        .from("fish_categories")
        .select("*")
        .order("name", { ascending: true });

      // Apply active filter by default
      if (filters.is_active !== undefined) {
        query = query.eq("is_active", filters.is_active);
      } else {
        query = query.eq("is_active", true);
      }

      // Apply search filter
      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`,
        );
      }

      return query;
    });
  },

  /**
   * Get category by ID
   */
  async findById(id) {
    return executeQuery(async () => {
      const result = await supabase
        .from("fish_categories")
        .select("*")
        .eq("id", id)
        .single();

      return result;
    });
  },

  /**
   * Get category by name
   */
  async findByName(name) {
    return executeQuery(async () => {
      const result = await supabase
        .from("fish_categories")
        .select("*")
        .eq("name", name)
        .single();

      return result;
    });
  },

  /**
   * Create new category
   */
  async create(categoryData) {
    const { name, description } = categoryData;

    return executeQuery(async () => {
      const result = await supabase
        .from("fish_categories")
        .insert({
          name,
          description,
          is_active: true,
        })
        .select()
        .single();

      return result;
    });
  },

  /**
   * Update category
   */
  async update(id, categoryData) {
    const { name, description, is_active } = categoryData;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (is_active !== undefined) updateData.is_active = is_active;

    return executeQuery(async () => {
      const result = await supabase
        .from("fish_categories")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      return result;
    });
  },

  /**
   * Delete category (soft delete)
   */
  async delete(id) {
    return softDelete(supabase, "fish_categories", id);
  },

  /**
   * Hard delete category
   */
  async hardDelete(id) {
    return executeQuery(async () => {
      const result = await supabase
        .from("fish_categories")
        .delete()
        .eq("id", id);

      return result;
    });
  },

  /**
   * Get category with fish count
   */
  async getWithFishCount() {
    return executeQuery(async () => {
      // First get all categories
      const { data: categories } = await supabase
        .from("fish_categories")
        .select("*")
        .eq("is_active", true)
        .order("name");

      // Then get fish counts for each category
      const categoriesWithCount = await Promise.all(
        categories.map(async (category) => {
          const { count } = await supabase
            .from("fishes")
            .select("*", { count: "exact", head: true })
            .eq("category_id", category.id)
            .eq("is_active", true);

          return {
            ...category,
            fish_count: count || 0,
          };
        }),
      );

      return { data: categoriesWithCount };
    });
  },
};

module.exports = Category;
