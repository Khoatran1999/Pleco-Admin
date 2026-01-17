const db = require("../config/db");
const Inventory = require("./inventory.model");

// Resolve correct table names (some DBs may have singular or plural table names)
let _tablesCache = null;
async function resolveTables() {
  if (_tablesCache) return _tablesCache;

  // Use SQLite-compatible query to check existing tables
  const [rows] = await db.execute(
    `SELECT name as table_name FROM sqlite_master WHERE type='table' AND name IN ('import_orders', 'import_order', 'import_order_items', 'import_order_item')`
  );

  const existing = new Set(rows.map((r) => r.table_name));

  const candidates = [
    { orders: "import_orders", items: "import_order_items" },
    { orders: "import_order", items: "import_order_item" },
  ];

  for (const c of candidates) {
    if (existing.has(c.orders) && existing.has(c.items)) {
      _tablesCache = c;
      return _tablesCache;
    }
  }

  // Fallback to plural names
  _tablesCache = candidates[0];
  return _tablesCache;
}

const ImportOrder = {
  async getAll(filters = {}) {
    const { orders: ordersTable, items: itemsTable } = await resolveTables();
    let query = `
      SELECT io.*, s.name as supplier_name,
             (SELECT COUNT(*) FROM ${itemsTable} WHERE import_order_id = io.id) as item_count
      FROM ${ordersTable} io
      JOIN suppliers s ON io.supplier_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += " AND io.status = ?";
      params.push(filters.status);
    }

    if (filters.supplier_id) {
      query += " AND io.supplier_id = ?";
      params.push(filters.supplier_id);
    }

    query += " ORDER BY io.created_at DESC";

    if (filters.limit) {
      query += " LIMIT ?";
      params.push(parseInt(filters.limit));
    }

    const [rows] = await db.execute(query, params);
    return rows;
  },

  async findById(id) {
    const { orders: ordersTable, items: itemsTable } = await resolveTables();
    const [orders] = await db.execute(
      `SELECT io.*, s.name as supplier_name
       FROM ${ordersTable} io
       JOIN suppliers s ON io.supplier_id = s.id
       WHERE io.id = ?`,
      [id]
    );

    if (!orders[0]) return null;

    const [items] = await db.execute(
      `SELECT ioi.*, f.name as fish_name, f.sku
       FROM ${itemsTable} ioi
       JOIN fishes f ON ioi.fish_id = f.id
       WHERE ioi.import_order_id = ?`,
      [id]
    );

    return { ...orders[0], items };
  },

  async create(orderData, items, userId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      console.debug(
        "ImportOrder.create - orderData:",
        orderData,
        "items:",
        items
      );

      // Generate order number
      const orderNumber = `IMP-${Date.now()}`;

      // Calculate total (allow override from caller)
      const computedTotal = items.reduce(
        (sum, item) => sum + item.quantity * item.unit_price,
        0
      );
      const totalAmount =
        typeof orderData.total_amount === "number"
          ? Number(orderData.total_amount)
          : computedTotal;

      // Create order
      const { orders: ordersTable, items: itemsTable } = await resolveTables();
      const [result] = await connection.execute(
        `INSERT INTO ${ordersTable} (order_number, supplier_id, expected_delivery, status, total_amount, notes, created_by)
         VALUES (?, ?, ?, 'pending', ?, ?, ?)`,
        [
          orderNumber,
          orderData.supplier_id,
          orderData.expected_delivery || null,
          totalAmount,
          orderData.notes || null,
          userId,
        ]
      );

      const orderId = result.insertId;

      // Create order items
      for (const item of items) {
        const batchId = `B-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 4)
          .toUpperCase()}`;
        await connection.execute(
          `INSERT INTO ${itemsTable} (import_order_id, fish_id, quantity, unit_price, total_price, batch_id)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.fish_id,
            item.quantity,
            item.unit_price,
            item.quantity * item.unit_price,
            batchId,
          ]
        );
      }

      await connection.commit();
      return orderId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async updateStatus(id, status, userId, newTotal) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Get order items
      const { items: itemsTable, orders: ordersTable } = await resolveTables();
      const [items] = await connection.execute(
        `SELECT * FROM ${itemsTable} WHERE import_order_id = ?`,
        [id]
      );
      console.debug(
        `ImportOrder.updateStatus id=${id} status=${status} items:`,
        items
      );

      // If delivered, update inventory
      if (status === "delivered") {
        for (const item of items) {
          const qty = Number(item.quantity);
          console.debug(
            `ImportOrder.updateStatus - addStock fish_id=${item.fish_id} qty=${qty}`
          );
          await Inventory.addStock(
            item.fish_id,
            qty,
            userId,
            `Import Order #${id}`,
            "import_order",
            id,
            connection
          );
        }

        await connection.execute(
          `UPDATE ${ordersTable} SET status = ?, delivery_date = DATE('now')${
            typeof newTotal === "number" ? ", total_amount = ?" : ""
          } WHERE id = ?`,
          typeof newTotal === "number" ? [status, newTotal, id] : [status, id]
        );
      } else {
        await connection.execute(
          `UPDATE ${ordersTable} SET status = ?${
            typeof newTotal === "number" ? ", total_amount = ?" : ""
          } WHERE id = ?`,
          typeof newTotal === "number" ? [status, newTotal, id] : [status, id]
        );
      }

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
    const { orders: ordersTable } = await resolveTables();
    await db.execute(
      `DELETE FROM ${ordersTable} WHERE id = ? AND status = "pending"`,
      [id]
    );
    return true;
  },
};

module.exports = ImportOrder;
