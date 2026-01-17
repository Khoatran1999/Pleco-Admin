const db = require("../config/db");

const Fish = {
  async getAll(filters = {}) {
    let query = `
      SELECT f.*, 
             c.name as category_name,
             COALESCE(i.quantity, 0) as stock,
             CASE 
               WHEN COALESCE(i.quantity, 0) = 0 THEN 'Out of Stock'
               WHEN COALESCE(i.quantity, 0) <= f.min_stock THEN 'Low Stock'
               ELSE 'In Stock'
             END as status
      FROM fishes f
      LEFT JOIN fish_categories c ON f.category_id = c.id
      LEFT JOIN inventories i ON f.id = i.fish_id
      WHERE f.is_active = 1
    `;
    const params = [];

    if (filters.category_id) {
      query += " AND f.category_id = ?";
      params.push(filters.category_id);
    }

    if (filters.size) {
      query += " AND f.size = ?";
      params.push(filters.size);
    }

    if (filters.search) {
      query +=
        " AND (f.name LIKE ? OR f.scientific_name LIKE ? OR f.sku LIKE ? OR f.size LIKE ?)";
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (filters.status) {
      if (filters.status === "In Stock") {
        query += " AND COALESCE(i.quantity, 0) > f.min_stock";
      } else if (filters.status === "Low Stock") {
        query +=
          " AND COALESCE(i.quantity, 0) > 0 AND COALESCE(i.quantity, 0) <= f.min_stock";
      } else if (filters.status === "Out of Stock") {
        query += " AND COALESCE(i.quantity, 0) = 0";
      }
    }

    query += " ORDER BY f.name, f.size";

    if (filters.limit) {
      query += " LIMIT ?";
      params.push(parseInt(filters.limit));
    }

    if (filters.offset) {
      query += " OFFSET ?";
      params.push(parseInt(filters.offset));
    }

    const [rows] = await db.execute(query, params);
    return rows;
  },

  async findById(id) {
    const [rows] = await db.execute(
      `SELECT f.*, 
              c.name as category_name,
              COALESCE(i.quantity, 0) as stock,
              CASE 
                WHEN COALESCE(i.quantity, 0) = 0 THEN 'Out of Stock'
                WHEN COALESCE(i.quantity, 0) <= f.min_stock THEN 'Low Stock'
                ELSE 'In Stock'
              END as status
       FROM fishes f
       LEFT JOIN fish_categories c ON f.category_id = c.id
       LEFT JOIN inventories i ON f.id = i.fish_id
       WHERE f.id = ?`,
      [id]
    );
    return rows[0];
  },

  async create(fishData) {
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
      userId,
    } = fishData;

    // Generate a unique SKU if not provided
    let finalSku = sku && sku.trim() ? sku.trim() : null;
    const sanitize = (s) =>
      (s || "FISH")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase()
        .slice(0, 8) || "FISH";
    if (!finalSku) {
      const maxAttempts = 8;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const base = sanitize(name);
        const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
        const candidate = `${base}-${suffix}`;
        const [rows] = await db.execute(
          "SELECT COUNT(*) as cnt FROM fishes WHERE sku = ?",
          [candidate]
        );
        if (rows[0].cnt === 0) {
          finalSku = candidate;
          break;
        }
      }
      if (!finalSku) finalSku = `FISH-${Date.now()}`;
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // If a fish with same name+size exists but is soft-deleted, reactivate and update it instead of inserting
      const [existingRows] = await connection.execute(
        "SELECT id, is_active FROM fishes WHERE name = ? AND size IS ? LIMIT 1",
        [name, size || null]
      );

      let fishId;
      if (
        existingRows &&
        existingRows.length > 0 &&
        existingRows[0].is_active === 0
      ) {
        fishId = existingRows[0].id;
        await connection.execute(
          `UPDATE fishes SET sku = ?, name = ?, scientific_name = ?, category_id = ?, size = ?, description = ?, retail_price = ?, wholesale_price = ?, cost_price = ?, unit = ?, image = ?, min_stock = ?, is_active = 1 WHERE id = ?`,
          [
            finalSku,
            name,
            scientific_name || null,
            category_id || null,
            size || null,
            description || null,
            retail_price || 0,
            wholesale_price || 0,
            cost_price || 0,
            unit || "pieces",
            image || null,
            min_stock || 10,
            fishId,
          ]
        );
      } else {
        const [result] = await connection.execute(
          `INSERT INTO fishes (sku, name, scientific_name, category_id, size, description, retail_price, wholesale_price, cost_price, unit, image, min_stock) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            finalSku,
            name,
            scientific_name || null,
            category_id || null,
            size || null,
            description || null,
            retail_price || 0,
            wholesale_price || 0,
            cost_price || 0,
            unit || "pieces",
            image || null,
            min_stock || 10,
          ]
        );
        fishId = result.insertId;
      }

      const initQty = stock !== undefined && stock !== null ? Number(stock) : 0;

      // Upsert inventory for this fish
      const [invRows] = await connection.execute(
        "SELECT id FROM inventories WHERE fish_id = ?",
        [fishId]
      );
      if (invRows.length === 0) {
        await connection.execute(
          "INSERT INTO inventories (fish_id, quantity) VALUES (?, ?)",
          [fishId, initQty]
        );
      } else {
        await connection.execute(
          "UPDATE inventories SET quantity = ? WHERE fish_id = ?",
          [initQty, fishId]
        );
      }

      if (initQty > 0) {
        await connection.execute(
          `INSERT INTO inventory_logs (fish_id, type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, note, created_by)
           VALUES (?, 'import', ?, ?, ?, ?, ?, ?, ?)`,
          [
            fishId,
            initQty,
            0,
            initQty,
            null,
            null,
            "Initial stock on create",
            userId || null,
          ]
        );
      }

      await connection.commit();
      return fishId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async update(id, fishData) {
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
      userId,
      stock_note,
    } = fishData;

    // If stock is not provided, simple update
    if (stock === undefined || stock === null) {
      await db.execute(
        `UPDATE fishes SET sku = ?, name = ?, scientific_name = ?, category_id = ?, size = ?, description = ?, 
         retail_price = ?, wholesale_price = ?, cost_price = ?, unit = ?, image = ?, min_stock = ? WHERE id = ?`,
        [
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
          id,
        ]
      );
      return true;
    }

    // If stock provided, perform transactional update to keep inventory and logs consistent
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      await connection.execute(
        `UPDATE fishes SET sku = ?, name = ?, scientific_name = ?, category_id = ?, size = ?, description = ?, 
         retail_price = ?, wholesale_price = ?, cost_price = ?, unit = ?, image = ?, min_stock = ? WHERE id = ?`,
        [
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
          id,
        ]
      );

      // Get current inventory
      const [rows] = await connection.execute(
        "SELECT quantity FROM inventories WHERE fish_id = ?",
        [id]
      );
      const currentQty =
        rows[0] && rows[0].quantity !== undefined
          ? Number(rows[0].quantity)
          : 0;
      const newQty = Number(stock);

      if (rows.length === 0) {
        await connection.execute(
          "INSERT INTO inventories (fish_id, quantity) VALUES (?, ?)",
          [id, newQty]
        );
      } else {
        await connection.execute(
          "UPDATE inventories SET quantity = ? WHERE fish_id = ?",
          [newQty, id]
        );
      }

      const qtyChange = newQty - currentQty;
      await connection.execute(
        `INSERT INTO inventory_logs (fish_id, type, quantity_change, quantity_before, quantity_after, note, created_by)
         VALUES (?, 'adjustment', ?, ?, ?, ?, ?)`,
        [id, qtyChange, currentQty, newQty, stock_note || null, userId || null]
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async delete(id) {
    await db.execute("UPDATE fishes SET is_active = 0 WHERE id = ?", [id]);
    return true;
  },

  async count(filters = {}) {
    let query =
      "SELECT COUNT(*) as total FROM fishes f LEFT JOIN inventories i ON f.id = i.fish_id WHERE f.is_active = 1";
    const params = [];

    if (filters.category) {
      query += " AND f.category = ?";
      params.push(filters.category);
    }

    if (filters.search) {
      query +=
        " AND (f.name LIKE ? OR f.scientific_name LIKE ? OR f.sku LIKE ?)";
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const [rows] = await db.execute(query, params);
    return rows[0].total;
  },
};

module.exports = Fish;
