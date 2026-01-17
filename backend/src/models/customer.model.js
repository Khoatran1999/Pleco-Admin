const db = require("../config/db");

const Customer = {
  async getAll() {
    const [rows] = await db.execute(
      "SELECT * FROM customers WHERE is_active = 1 ORDER BY name"
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await db.execute("SELECT * FROM customers WHERE id = ?", [
      id,
    ]);
    return rows[0];
  },

  async create(customerData) {
    const { name, email, phone, address, social } = customerData;
    const [result] = await db.execute(
      "INSERT INTO customers (name, email, social, phone, address) VALUES (?, ?, ?, ?, ?)",
      [name, email || null, social || null, phone || null, address || null]
    );
    return result.insertId;
  },

  async update(id, customerData) {
    const { name, email, phone, address, social } = customerData;
    await db.execute(
      "UPDATE customers SET name = ?, email = ?, social = ?, phone = ?, address = ? WHERE id = ?",
      [name, email, social, phone, address, id]
    );
    return true;
  },

  async delete(id) {
    await db.execute("UPDATE customers SET is_active = 0 WHERE id = ?", [id]);
    return true;
  },

  async search(searchTerm) {
    const [rows] = await db.execute(
      `SELECT * FROM customers 
       WHERE is_active = 1 
       AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR social LIKE ?)
       ORDER BY name LIMIT 10`,
      [
        `%${searchTerm}%`,
        `%${searchTerm}%`,
        `%${searchTerm}%`,
        `%${searchTerm}%`,
      ]
    );
    return rows;
  },
};

module.exports = Customer;
