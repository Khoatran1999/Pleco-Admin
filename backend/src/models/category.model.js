const db = require("../config/db");

const Category = {
  async getAll() {
    const [rows] = await db.execute(`
      SELECT c.*, 
             (SELECT COUNT(*) FROM fishes f WHERE f.category_id = c.id AND f.is_active = 1) as fish_count
      FROM fish_categories c
      WHERE c.is_active = 1
      ORDER BY c.name
    `);
    return rows;
  },

  async findById(id) {
    const [rows] = await db.execute(
      "SELECT * FROM fish_categories WHERE id = ? AND is_active = 1",
      [id]
    );
    return rows[0];
  },

  async findByName(name) {
    const [rows] = await db.execute(
      "SELECT * FROM fish_categories WHERE name = ? AND is_active = 1",
      [name]
    );
    return rows[0];
  },

  async create(categoryData) {
    const { name, description } = categoryData;
    const [result] = await db.execute(
      "INSERT INTO fish_categories (name, description) VALUES (?, ?)",
      [name, description || null]
    );
    return result.insertId;
  },

  async update(id, categoryData) {
    const { name, description } = categoryData;
    await db.execute(
      "UPDATE fish_categories SET name = ?, description = ? WHERE id = ?",
      [name, description, id]
    );
    return true;
  },

  async delete(id) {
    // Soft delete
    await db.execute("UPDATE fish_categories SET is_active = 0 WHERE id = ?", [
      id,
    ]);
    return true;
  },

  async count() {
    const [rows] = await db.execute(
      "SELECT COUNT(*) as total FROM fish_categories WHERE is_active = 1"
    );
    return rows[0].total;
  },
};

module.exports = Category;
