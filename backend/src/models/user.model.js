const db = require("../config/db");

const User = {
  async findByUsername(username) {
    const [rows] = await db.execute(
      `SELECT u.*, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.username = ? OR u.email = ?`,
      [username, username]
    );
    return rows[0];
  },

  async findById(id) {
    const [rows] = await db.execute(
      `SELECT u.id, u.username, u.email, u.full_name, u.is_active, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ?`,
      [id]
    );
    return rows[0];
  },

  async create(userData) {
    const { username, email, password, full_name, role_id } = userData;
    const [result] = await db.execute(
      "INSERT INTO users (username, email, password, full_name, role_id) VALUES (?, ?, ?, ?, ?)",
      [username, email, password, full_name, role_id || 3]
    );
    return result.insertId;
  },

  async getAll() {
    const [rows] = await db.execute(
      `SELECT u.id, u.username, u.email, u.full_name, u.is_active, u.created_at, r.name as role_name 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       ORDER BY u.created_at DESC`
    );
    return rows;
  },
};

module.exports = User;
