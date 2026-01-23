/**
 * Fish Model - Supabase Version
 * Handles fish products CRUD operations
 */

const supabase = require('../config/supabase');
const { executeQuery, applyPagination, softDelete } = require('../utils/supabase-query');
const { sanitizeForLike } = require('../utils/security');
const Inventory = require('./inventory.model.supabase');

const Fish = {
  /**
   * Get all fishes with filters and inventory info
   */
  async getAll(filters = {}) {
    return executeQuery(async () => {
      let query = supabase.from('fishes').select(
        `
          *,
          fish_categories (
            id,
            name,
            description
          ),
          inventories (
            quantity,
            last_updated
          )
        `,
        { count: 'exact' },
      );

      // Apply active filter by default
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      } else {
        query = query.eq('is_active', true);
      }

      // Apply category filter
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }

      // Apply size filter
      if (filters.size) {
        query = query.eq('size', filters.size);
      }

      // Apply search filter
      if (filters.search) {
        const s = sanitizeForLike(filters.search);
        query = query.or(
          `name.ilike.%${s}%,scientific_name.ilike.%${s}%,sku.ilike.%${s}%,size.ilike.%${s}%`,
        );
      }

      // Apply stock status filter
      if (filters.status) {
        // This requires post-processing as we need to calculate based on inventory
        // Will filter after fetch
      }

      // Apply sorting
      const sortBy = filters.sort_by || 'name';
      const sortOrder = filters.sort_order === 'desc' ? false : true;
      query = query.order(sortBy, { ascending: sortOrder });

      // Apply pagination
      if (filters.page && filters.limit) {
        query = applyPagination(query, filters.page, filters.limit);
      } else if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const result = await query;

      // Post-process to add stock status
      if (result.data) {
        result.data = result.data.map((fish) => {
          const quantity = fish.inventories?.quantity || 0;
          let status = 'Out of Stock';

          if (quantity > 0 && quantity <= fish.min_stock) {
            status = 'Low Stock';
          } else if (quantity > fish.min_stock) {
            status = 'In Stock';
          }

          return {
            ...fish,
            stock: quantity,
            status,
            category_name: fish.fish_categories?.name,
          };
        });

        // Apply status filter if provided
        if (filters.status) {
          result.data = result.data.filter((fish) => fish.status === filters.status);
        }
      }

      return result;
    });
  },

  /**
   * Count fishes with filters
   */
  async count(filters = {}) {
    return executeQuery(async () => {
      let query = supabase.from('fishes').select('*', { count: 'exact', head: true });

      // Apply active filter by default
      if (filters.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      } else {
        query = query.eq('is_active', true);
      }

      // Apply category filter
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }

      // Apply size filter
      if (filters.size) {
        query = query.eq('size', filters.size);
      }

      // Apply search filter
      if (filters.search) {
        const s = sanitizeForLike(filters.search);
        query = query.or(
          `name.ilike.%${s}%,scientific_name.ilike.%${s}%,sku.ilike.%${s}%,size.ilike.%${s}%`,
        );
      }

      const { count, error } = await query;

      if (error) throw error;

      return count || 0;
    });
  },

  /**
   * Get fish by ID with full details
   */
  async findById(id) {
    return executeQuery(async () => {
      const result = await supabase
        .from('fishes')
        .select(
          `
          *,
          fish_categories (
            id,
            name,
            description
          ),
          inventories (
            quantity,
            last_updated
          )
        `,
        )
        .eq('id', id)
        .single();

      if (result.data) {
        const quantity = result.data.inventories?.quantity || 0;
        let status = 'Out of Stock';

        if (quantity > 0 && quantity <= result.data.min_stock) {
          status = 'Low Stock';
        } else if (quantity > result.data.min_stock) {
          status = 'In Stock';
        }

        result.data = {
          ...result.data,
          stock: quantity,
          status,
          category_name: result.data.fish_categories?.name,
        };
      }

      return result;
    });
  },

  /**
   * Get fish by SKU
   */
  async findBySku(sku) {
    return executeQuery(async () => {
      const result = await supabase
        .from('fishes')
        .select(
          `
          *,
          fish_categories (
            id,
            name,
            description
          ),
          inventories (
            quantity,
            last_updated
          )
        `,
        )
        .eq('sku', sku)
        .single();

      return result;
    });
  },

  /**
   * Create new fish
   */
  async create(fishData, userId) {
    const {
      sku,
      name,
      scientific_name,
      category_id,
      size,
      description,
      retail_price,
      wholesale_price,
      cost_price,
      unit,
      image,
      min_stock,
      stock,
    } = fishData;

    return executeQuery(async () => {
      // Start transaction-like operation
      // 1. Create fish
      const { data: fish, error: fishError } = await supabase
        .from('fishes')
        .insert({
          sku,
          name,
          scientific_name,
          category_id,
          size,
          description,
          retail_price: parseFloat(retail_price) || 0,
          wholesale_price: parseFloat(wholesale_price) || 0,
          cost_price: parseFloat(cost_price) || 0,
          unit: unit || 'pieces',
          image,
          min_stock: parseInt(min_stock) || 10,
          is_active: true,
        })
        .select()
        .single();

      if (fishError) throw fishError;

      // 2. Create inventory record if stock provided
      if (stock !== undefined && stock > 0) {
        const { error: invError } = await supabase.from('inventories').insert({
          fish_id: fish.id,
          quantity: parseFloat(stock) || 0,
        });

        if (invError) throw invError;

        // 3. Create inventory log
        await supabase.from('inventory_logs').insert({
          fish_id: fish.id,
          type: 'adjustment',
          quantity_change: parseFloat(stock) || 0,
          quantity_before: 0,
          quantity_after: parseFloat(stock) || 0,
          note: 'Initial stock',
          created_by: userId,
        });
      }

      return { data: fish };
    });
  },

  /**
   * Update fish
   */
  async update(id, fishData) {
    const {
      name,
      scientific_name,
      category_id,
      size,
      description,
      retail_price,
      wholesale_price,
      cost_price,
      unit,
      image,
      min_stock,
      is_active,
      // optional: when provided, we also adjust inventory
      stock,
      userId,
    } = fishData;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (scientific_name !== undefined) updateData.scientific_name = scientific_name;
    if (category_id !== undefined) updateData.category_id = category_id;
    if (size !== undefined) updateData.size = size;
    if (description !== undefined) updateData.description = description;
    if (retail_price !== undefined) updateData.retail_price = parseFloat(retail_price);
    if (wholesale_price !== undefined) updateData.wholesale_price = parseFloat(wholesale_price);
    if (cost_price !== undefined) updateData.cost_price = parseFloat(cost_price);
    if (unit !== undefined) updateData.unit = unit;
    if (image !== undefined) updateData.image = image;
    if (min_stock !== undefined) updateData.min_stock = parseInt(min_stock);
    if (is_active !== undefined) updateData.is_active = is_active;

    return executeQuery(async () => {
      // 1) Update fish master data
      const result = await supabase
        .from('fishes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      // 2) If stock is provided, update inventory as well
      if (stock !== undefined) {
        // Use Inventory model to handle upsert + logging
        await Inventory.updateQuantity(
          id,
          parseFloat(stock),
          'adjustment',
          null,
          userId,
          'Manual stock update via fish update',
        );
      }

      return result;
    });
  },

  /**
   * Delete fish (soft delete)
   */
  async delete(id) {
    return softDelete(supabase, 'fishes', id);
  },

  /**
   * Upload fish image
   */
  async uploadImage(fishId, file) {
    const fileName = `fish-${fishId}-${Date.now()}${file.originalname}`;

    // Upload to Supabase Storage
    const { error } = await supabase.storage.from('fish-images').upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

    if (error) throw error;

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('fish-images').getPublicUrl(fileName);

    // Update fish record
    await this.update(fishId, { image: publicUrl });

    return publicUrl;
  },

  /**
   * Get low stock fishes
   */
  async getLowStock() {
    return executeQuery(async () => {
      const { data: fishes } = await supabase
        .from('fishes')
        .select(
          `
          *,
          fish_categories (name),
          inventories (quantity)
        `,
        )
        .eq('is_active', true);

      // Filter where quantity <= min_stock and quantity > 0
      const lowStockFishes =
        fishes?.filter((fish) => {
          const qty = fish.inventories?.quantity || 0;
          return qty > 0 && qty <= fish.min_stock;
        }) || [];

      return { data: lowStockFishes };
    });
  },

  /**
   * Get out of stock fishes
   */
  async getOutOfStock() {
    return executeQuery(async () => {
      const { data: fishes } = await supabase
        .from('fishes')
        .select(
          `
          *,
          fish_categories (name),
          inventories (quantity)
        `,
        )
        .eq('is_active', true);

      // Filter where quantity = 0
      const outOfStockFishes =
        fishes?.filter((fish) => {
          const qty = fish.inventories?.quantity || 0;
          return qty === 0;
        }) || [];

      return { data: outOfStockFishes };
    });
  },
};

module.exports = Fish;
