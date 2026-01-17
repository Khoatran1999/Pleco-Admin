const db = require("../config/db");

const Inventory = {
  async getAll() {
    const [rows] = await db.execute(`
      SELECT i.*, f.name as fish_name, f.sku, f.size, f.image, f.retail_price, f.wholesale_price, fc.name as category_name, f.min_stock,
             CASE 
               WHEN i.quantity = 0 THEN 'Out of Stock'
               WHEN i.quantity <= f.min_stock THEN 'Low Stock'
               ELSE 'In Stock'
             END as status
      FROM inventories i
      JOIN fishes f ON i.fish_id = f.id
      LEFT JOIN fish_categories fc ON f.category_id = fc.id
      WHERE f.is_active = 1
      ORDER BY f.name
    `);
    // Ensure numeric fields are numbers
    return rows.map((r) => ({
      ...r,
      quantity: r.quantity !== undefined ? Number(r.quantity) : 0,
      min_stock: r.min_stock !== undefined ? Number(r.min_stock) : 0,
      retail_price: r.retail_price !== undefined ? Number(r.retail_price) : 0,
      wholesale_price:
        r.wholesale_price !== undefined ? Number(r.wholesale_price) : 0,
    }));
  },

  async getByFishId(fishId) {
    const [rows] = await db.execute(
      "SELECT * FROM inventories WHERE fish_id = ?",
      [fishId]
    );
    if (!rows[0]) return null;
    const row = rows[0];
    return {
      ...row,
      quantity: row.quantity !== undefined ? Number(row.quantity) : 0,
    };
  },

  async updateQuantity(fishId, newQuantity) {
    await db.execute("UPDATE inventories SET quantity = ? WHERE fish_id = ?", [
      newQuantity,
      fishId,
    ]);
    return true;
  },

  async addStock(
    fishId,
    quantity,
    userId,
    note = null,
    referenceType = null,
    referenceId = null,
    externalConnection = null
  ) {
    const connection = externalConnection || (await db.getConnection());
    const startedTx = !externalConnection;
    try {
      if (startedTx) await connection.beginTransaction();

      // Get current quantity
      const [current] = await connection.execute(
        "SELECT quantity FROM inventories WHERE fish_id = ?",
        [fishId]
      );
      const currentQty =
        current[0]?.quantity !== undefined ? Number(current[0].quantity) : null;
      const addQty = Number(quantity);
      let newQty;

      if (currentQty === null) {
        // No inventory row exists for this fish yet — insert one
        newQty = addQty;
        await connection.execute(
          "INSERT INTO inventories (fish_id, quantity) VALUES (?, ?)",
          [fishId, newQty]
        );
      } else {
        newQty = parseFloat(currentQty) + addQty;
        // Update inventory
        await connection.execute(
          "UPDATE inventories SET quantity = ? WHERE fish_id = ?",
          [newQty, fishId]
        );
      }

      // Log the change
      await connection.execute(
        `INSERT INTO inventory_logs (fish_id, type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, note, created_by)
         VALUES (?, 'import', ?, ?, ?, ?, ?, ?, ?)`,
        [
          fishId,
          quantity,
          currentQty,
          newQty,
          referenceType,
          referenceId,
          note,
          userId,
        ]
      );

      if (startedTx) await connection.commit();
      return newQty;
    } catch (error) {
      if (startedTx) await connection.rollback();
      throw error;
    } finally {
      if (startedTx) connection.release();
    }
  },

  async reduceStock(
    fishId,
    quantity,
    userId,
    note = null,
    referenceType = null,
    referenceId = null
  ) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Get current quantity
      const [current] = await connection.execute(
        "SELECT quantity FROM inventories WHERE fish_id = ?",
        [fishId]
      );
      const currentQty = current[0]?.quantity || 0;

      if (currentQty < quantity) {
        throw new Error(
          `Insufficient stock. Available: ${currentQty}, Requested: ${quantity}`
        );
      }

      const newQty = parseFloat(currentQty) - parseFloat(quantity);

      // Update inventory
      await connection.execute(
        "UPDATE inventories SET quantity = ? WHERE fish_id = ?",
        [newQty, fishId]
      );

      // Log the change
      await connection.execute(
        `INSERT INTO inventory_logs (fish_id, type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, note, created_by)
         VALUES (?, 'sale', ?, ?, ?, ?, ?, ?, ?)`,
        [
          fishId,
          -quantity,
          currentQty,
          newQty,
          referenceType,
          referenceId,
          note,
          userId,
        ]
      );

      await connection.commit();
      return newQty;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Record fish loss/damage
  async recordLoss(fishId, quantity, userId, lossReason = null, note = null) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Get current quantity
      const [current] = await connection.execute(
        "SELECT quantity FROM inventories WHERE fish_id = ?",
        [fishId]
      );
      const currentQty = current[0]?.quantity || 0;

      if (currentQty < quantity) {
        throw new Error(
          `Cannot record loss greater than stock. Available: ${currentQty}, Loss: ${quantity}`
        );
      }

      const newQty = parseFloat(currentQty) - parseFloat(quantity);

      // Update inventory
      await connection.execute(
        "UPDATE inventories SET quantity = ? WHERE fish_id = ?",
        [newQty, fishId]
      );

      // Log the loss
      await connection.execute(
        `INSERT INTO inventory_logs (fish_id, type, quantity_change, quantity_before, quantity_after, loss_reason, note, created_by)
         VALUES (?, 'loss', ?, ?, ?, ?, ?, ?)`,
        [fishId, -quantity, currentQty, newQty, lossReason, note, userId]
      );

      await connection.commit();
      return newQty;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Get loss history
  async getLossLogs(fishId = null, limit = 50) {
    let query = `
      SELECT il.*, f.name as fish_name, f.size, u.full_name as created_by_name
      FROM inventory_logs il
      JOIN fishes f ON il.fish_id = f.id
      LEFT JOIN users u ON il.created_by = u.id
      WHERE il.type = 'loss'
    `;
    const params = [];

    if (fishId) {
      query += " AND il.fish_id = ?";
      params.push(fishId);
    }

    query += " ORDER BY il.created_at DESC LIMIT ?";
    params.push(limit);

    const [rows] = await db.execute(query, params);
    return rows.map((r) => ({
      ...r,
      quantity_change:
        r.quantity_change !== undefined ? Number(r.quantity_change) : 0,
      quantity_before:
        r.quantity_before !== undefined ? Number(r.quantity_before) : 0,
      quantity_after:
        r.quantity_after !== undefined ? Number(r.quantity_after) : 0,
    }));
  },

  async getLogs(fishId = null, limit = 50) {
    let query = `
      SELECT il.*, f.name as fish_name, u.full_name as created_by_name
      FROM inventory_logs il
      JOIN fishes f ON il.fish_id = f.id
      LEFT JOIN users u ON il.created_by = u.id
    `;
    const params = [];

    if (fishId) {
      query += " WHERE il.fish_id = ?";
      params.push(fishId);
    }

    query += " ORDER BY il.created_at DESC LIMIT ?";
    params.push(limit);

    const [rows] = await db.execute(query, params);
    return rows.map((r) => ({
      ...r,
      quantity_change:
        r.quantity_change !== undefined ? Number(r.quantity_change) : 0,
      quantity_before:
        r.quantity_before !== undefined ? Number(r.quantity_before) : 0,
      quantity_after:
        r.quantity_after !== undefined ? Number(r.quantity_after) : 0,
    }));
  },

  async getTotalInventory() {
    const [rows] = await db.execute(`
      SELECT SUM(i.quantity) as total_quantity, COUNT(f.id) as total_products
      FROM inventories i
      JOIN fishes f ON i.fish_id = f.id
      WHERE f.is_active = 1
    `);
    const r = rows[0] || { total_quantity: 0, total_products: 0 };
    return {
      total_quantity:
        r.total_quantity !== undefined ? Number(r.total_quantity) : 0,
      total_products:
        r.total_products !== undefined ? Number(r.total_products) : 0,
    };
  },
};

module.exports = Inventory;
