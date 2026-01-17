/**
 * SQLite Database Configuration for Electron App
 * Compatible wrapper around better-sqlite3 to match mysql2/promise API
 */

const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

// Determine database path
const isElectron = process.versions && process.versions.electron;
let dbPath;

// Allow explicit override via env var so the app (dev or Electron) can
// be pointed at a single database file: set `DATABASE_PATH`.
if (process.env.DATABASE_PATH) {
  dbPath = path.resolve(process.env.DATABASE_PATH);
  console.log(`📦 Using DATABASE_PATH from env: ${dbPath}`);
} else if (isElectron) {
  // Electron app: try multiple possible paths
  const possiblePaths = [
    // Packaged app: resources/app/database (most common)
    path.join(__dirname, "..", "..", "..", "database", "fishmarket.db"),
    // Alternative packaged path
    path.join(__dirname, "..", "..", "database", "fishmarket.db"),
    // Dev mode from project root
    path.join(process.cwd(), "database", "fishmarket.db"),
  ];

  // Find the first path that exists
  dbPath = possiblePaths.find((p) => fs.existsSync(p));

  // If no existing path found, use the first one (will show error later)
  if (!dbPath) {
    console.log("📀 Checking paths:", possiblePaths);
    dbPath = possiblePaths[0];
  }
} else {
  // Development/production web: use project database folder
  dbPath = path.join(__dirname, "..", "..", "..", "database", "fishmarket.db");
}

console.log(`📀 SQLite database path: ${dbPath}`);

// Initialize database
let db;

function initDatabase() {
  try {
    // Ensure directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Open database
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL"); // Better performance
    db.pragma("foreign_keys = ON"); // Enforce foreign keys

    // Database schema should already exist from migration
    // Don't reinitialize to preserve migrated data
    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
      )
      .all();

    if (tables.length === 0) {
      console.warn("⚠️ Database is empty! Please run migration script first.");
      console.warn("Run: node scripts/migrate-mysql-to-sqlite.js");
    }

    console.log("✅ SQLite database connected successfully");
    return db;
  } catch (error) {
    console.error("❌ SQLite database initialization failed:", error);
    throw error;
  }
}

/**
 * Wrapper to make better-sqlite3 compatible with mysql2/promise API
 */
class SQLitePoolWrapper {
  constructor() {
    if (!db) {
      initDatabase();
    }
    this.db = db;
  }

  /**
   * Execute a query - compatible with mysql2 execute()
   * @param {string} sql - SQL query with ? placeholders
   * @param {Array} params - Query parameters
   * @returns {Promise<[Array, Array]>} - [rows, fields]
   */
  async execute(sql, params = []) {
    return new Promise((resolve, reject) => {
      try {
        // Normalize SQL (handle some MySQL-specific syntax)
        let normalizedSQL = sql;

        // Handle INSERT/UPDATE/DELETE
        if (
          sql.trim().toUpperCase().startsWith("INSERT") ||
          sql.trim().toUpperCase().startsWith("UPDATE") ||
          sql.trim().toUpperCase().startsWith("DELETE")
        ) {
          const stmt = this.db.prepare(normalizedSQL);
          const result = stmt.run(...params);

          // Return format similar to mysql2
          resolve([
            {
              affectedRows: result.changes,
              insertId: result.lastInsertRowid,
            },
            [],
          ]);
        } else {
          // Handle SELECT
          const stmt = this.db.prepare(normalizedSQL);
          const rows = stmt.all(...params);
          resolve([rows, []]);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get a connection (for compatibility, returns this)
   */
  async getConnection() {
    return {
      execute: this.execute.bind(this),
      release: () => {}, // No-op for SQLite
      beginTransaction: () => this.db.prepare("BEGIN TRANSACTION").run(),
      commit: () => this.db.prepare("COMMIT").run(),
      rollback: () => this.db.prepare("ROLLBACK").run(),
    };
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

// Export singleton instance
const pool = new SQLitePoolWrapper();

module.exports = pool;
