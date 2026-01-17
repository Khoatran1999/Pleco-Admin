const db = require("../config/db");
const Inventory = require("./inventory.model");
const Customer = require("./customer.model");

const SaleOrder = {
  async getAll(filters = {}) {
    let query = `
      SELECT so.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone, c.address as customer_address, c.social as customer_social,
             (SELECT COUNT(*) FROM sale_order_items WHERE sale_order_id = so.id) as item_count
      FROM sale_orders so
      LEFT JOIN customers c ON so.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.status) {
      query += " AND so.status = ?";
      params.push(filters.status);
    }

    if (filters.customer_id) {
      query += " AND so.customer_id = ?";
      params.push(filters.customer_id);
    }

    if (filters.date_from) {
      query += " AND so.order_date >= ?";
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      query += " AND so.order_date <= ?";
      params.push(filters.date_to);
    }

    query += " ORDER BY so.created_at DESC";

    if (filters.limit) {
      query += " LIMIT ?";
      params.push(parseInt(filters.limit));
    }

    const [rows] = await db.execute(query, params);
    return rows;
  },

  async findById(id) {
    const [orders] = await db.execute(
      `SELECT so.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone, c.address as customer_address, c.social as customer_social,
             (SELECT COUNT(*) FROM sale_order_items WHERE sale_order_id = so.id) as item_count
       FROM sale_orders so
       LEFT JOIN customers c ON so.customer_id = c.id
       WHERE so.id = ?`,
      [id]
    );

    if (!orders[0]) return null;

    const [items] = await db.execute(
      `SELECT soi.*, f.name as fish_name, f.sku
       FROM sale_order_items soi
       JOIN fishes f ON soi.fish_id = f.id
       WHERE soi.sale_order_id = ?`,
      [id]
    );

    return { ...orders[0], items };
  },

  async create(orderData, items, userId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Validate stock for all items
      for (const item of items) {
        const [inventory] = await connection.execute(
          "SELECT quantity FROM inventories WHERE fish_id = ?",
          [item.fish_id]
        );
        const currentStock = Number(inventory[0]?.quantity || 0);
        if (currentStock < Number(item.quantity)) {
          const [fish] = await connection.execute(
            "SELECT name FROM fishes WHERE id = ?",
            [item.fish_id]
          );
          throw new Error(
            `Insufficient stock for ${
              fish[0]?.name || "product"
            }. Available: ${currentStock}, Requested: ${item.quantity}`
          );
        }
      }

      // Determine customer: if customer_id provided use it, otherwise if customer_name provided try to find or create customer
      let customerIdToUse = orderData.customer_id || null;
      if (!customerIdToUse && orderData.customer_name) {
        const name = String(orderData.customer_name).trim();
        if (name && name !== "Walk-in Customer") {
          // try find existing customer by exact name
          const [existing] = await connection.execute(
            "SELECT id FROM customers WHERE name = ? LIMIT 1",
            [name]
          );
          if (existing[0]) {
            customerIdToUse = existing[0].id;
          } else {
            // create new customer
            const newCustomerId = await Customer.create({ name });
            customerIdToUse = newCustomerId;
          }
        } else {
          customerIdToUse = null;
        }
      }

      // Generate order number
      const orderNumber = `INV-${Date.now()}`;

      // Calculate totals
      const subtotal = items.reduce(
        (sum, item) => sum + item.quantity * item.unit_price,
        0
      );
      const discountAmount = orderData.discount_amount || 0;
      const totalAmount = subtotal - discountAmount;

      // Create order
      const [result] = await connection.execute(
        `INSERT INTO sale_orders (order_number, customer_id, order_date, sale_type, status, subtotal, discount_amount, total_amount, payment_method, notes, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderNumber,
          customerIdToUse,
          orderData.order_date || new Date().toISOString().split("T")[0],
          orderData.sale_type || "retail",
          orderData.status || "pending",
          subtotal,
          discountAmount,
          totalAmount,
          orderData.payment_method || null,
          orderData.notes || null,
          userId,
        ]
      );

      const orderId = result.insertId;

      // Create order items and reduce stock
      for (const item of items) {
        await connection.execute(
          `INSERT INTO sale_order_items (sale_order_id, fish_id, quantity, unit_price, total_price)
           VALUES (?, ?, ?, ?, ?)`,
          [
            orderId,
            item.fish_id,
            item.quantity,
            item.unit_price,
            item.quantity * item.unit_price,
          ]
        );

        // Reduce stock
        const [currentInv] = await connection.execute(
          "SELECT quantity FROM inventories WHERE fish_id = ?",
          [item.fish_id]
        );
        const currentQty = Number(currentInv[0]?.quantity || 0);
        const newQty = Number(currentQty) - Number(item.quantity);

        await connection.execute(
          "UPDATE inventories SET quantity = ? WHERE fish_id = ?",
          [newQty, item.fish_id]
        );

        await connection.execute(
          `INSERT INTO inventory_logs (fish_id, type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, note, created_by)
           VALUES (?, 'sale', ?, ?, ?, 'sale_order', ?, ?, ?)`,
          [
            item.fish_id,
            -item.quantity,
            currentQty,
            newQty,
            orderId,
            `Sale Order #${orderId}`,
            userId,
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

  async updateStatus(id, status, userId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [orders] = await connection.execute(
        "SELECT * FROM sale_orders WHERE id = ?",
        [id]
      );
      if (!orders[0]) throw new Error("Order not found");

      const oldStatus = orders[0].status;

      // If order was previously cancelled and now being set to a non-cancelled status,
      // we need to re-apply the stock deduction for the order items.
      if (oldStatus === "cancelled" && status !== "cancelled") {
        const [items] = await connection.execute(
          "SELECT * FROM sale_order_items WHERE sale_order_id = ?",
          [id]
        );

        for (const item of items) {
          const [currentInv] = await connection.execute(
            "SELECT quantity FROM inventories WHERE fish_id = ?",
            [item.fish_id]
          );
          const currentQty = Number(currentInv[0]?.quantity || 0);
          const needed = Number(item.quantity);
          if (currentQty < needed) {
            throw new Error(
              `Insufficient stock to complete order for fish_id ${item.fish_id}. Available: ${currentQty}, Required: ${needed}`
            );
          }

          const newQty = currentQty - needed;

          await connection.execute(
            "UPDATE inventories SET quantity = ? WHERE fish_id = ?",
            [newQty, item.fish_id]
          );

          await connection.execute(
            `INSERT INTO inventory_logs (fish_id, type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, note, created_by)
             VALUES (?, 'sale', ?, ?, ?, 'sale_order', ?, ?, ?)`,
            [
              item.fish_id,
              -needed,
              currentQty,
              newQty,
              id,
              `Sale Order #${id}`,
              userId,
            ]
          );
        }
      }

      await connection.execute(
        "UPDATE sale_orders SET status = ? WHERE id = ?",
        [status, id]
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

  async cancel(id, userId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Get order
      const [orders] = await connection.execute(
        'SELECT * FROM sale_orders WHERE id = ? AND status != "cancelled"',
        [id]
      );

      if (!orders[0]) {
        throw new Error("Order not found or already cancelled");
      }

      // Get order items
      const [items] = await connection.execute(
        "SELECT * FROM sale_order_items WHERE sale_order_id = ?",
        [id]
      );

      // Restore stock
      for (const item of items) {
        const [currentInv] = await connection.execute(
          "SELECT quantity FROM inventories WHERE fish_id = ?",
          [item.fish_id]
        );
        const currentQty = Number(currentInv[0]?.quantity || 0);
        const newQty = Number(currentQty) + Number(item.quantity);

        await connection.execute(
          "UPDATE inventories SET quantity = ? WHERE fish_id = ?",
          [newQty, item.fish_id]
        );

        await connection.execute(
          `INSERT INTO inventory_logs (fish_id, type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, note, created_by)
           VALUES (?, 'adjustment', ?, ?, ?, 'sale_order_cancel', ?, ?, ?)`,
          [
            item.fish_id,
            item.quantity,
            currentQty,
            newQty,
            id,
            `Cancelled Sale Order #${id}`,
            userId,
          ]
        );
      }

      // Update order status
      await connection.execute(
        'UPDATE sale_orders SET status = "cancelled" WHERE id = ?',
        [id]
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

  async updateOrder(id, data, userId) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      let customerIdToUse = data.customer_id || null;
      if (!customerIdToUse && data.customer_name) {
        const name = String(data.customer_name).trim();
        if (name && name !== "Walk-in Customer") {
          const [existing] = await connection.execute(
            "SELECT id FROM customers WHERE name = ? LIMIT 1",
            [name]
          );
          if (existing[0]) {
            customerIdToUse = existing[0].id;
          } else {
            const Customer = require("./customer.model");
            customerIdToUse = await Customer.create({ name });
          }
        } else {
          customerIdToUse = null;
        }
      }

      await connection.execute(
        "UPDATE sale_orders SET customer_id = ?, notes = ? WHERE id = ?",
        [customerIdToUse, data.notes || null, id]
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

  async getTodaySales() {
    const [rows] = await db.execute(`
      SELECT COALESCE(SUM(total_amount), 0) as total_sales, COUNT(*) as order_count
      FROM sale_orders
      WHERE DATE(order_date) = DATE('now') AND status != 'cancelled'
    `);
    return rows[0];
  },
};

module.exports = SaleOrder;
