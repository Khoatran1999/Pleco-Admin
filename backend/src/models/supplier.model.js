const db = require("../config/db");

const Supplier = {
  async getAll() {
    const [rows] = await db.execute(
      "SELECT * FROM suppliers WHERE is_active = 1 ORDER BY name"
    );
    return rows;
  },

  async findById(id) {
    const [rows] = await db.execute("SELECT * FROM suppliers WHERE id = ?", [
      id,
    ]);
    return rows[0];
  },

  async create(supplierData) {
    const { name, contact_person, email, phone, address, avatar } =
      supplierData;
    if (avatar) {
      const [result] = await db.execute(
        "INSERT INTO suppliers (name, contact_person, email, phone, address, avatar) VALUES (?, ?, ?, ?, ?, ?)",
        [
          name,
          contact_person || null,
          email || null,
          phone || null,
          address || null,
          avatar,
        ]
      );
      return result.insertId;
    }

    const [result] = await db.execute(
      "INSERT INTO suppliers (name, contact_person, email, phone, address) VALUES (?, ?, ?, ?, ?)",
      [
        name,
        contact_person || null,
        email || null,
        phone || null,
        address || null,
      ]
    );
    return result.insertId;
  },

  async update(id, supplierData) {
    const { name, contact_person, email, phone, address, avatar } =
      supplierData;
    if (avatar) {
      await db.execute(
        "UPDATE suppliers SET name = ?, contact_person = ?, email = ?, phone = ?, address = ?, avatar = ? WHERE id = ?",
        [
          name,
          contact_person || null,
          email || null,
          phone || null,
          address || null,
          avatar,
          id,
        ]
      );
      return true;
    }

    await db.execute(
      "UPDATE suppliers SET name = ?, contact_person = ?, email = ?, phone = ?, address = ? WHERE id = ?",
      [
        name,
        contact_person || null,
        email || null,
        phone || null,
        address || null,
        id,
      ]
    );
    return true;
  },

  async delete(id) {
    await db.execute("UPDATE suppliers SET is_active = 0 WHERE id = ?", [id]);
    return true;
  },
};

module.exports = Supplier;
