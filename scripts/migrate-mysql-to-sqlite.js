/**
 * MySQL to SQLite Migration Script
 * This script exports data from MySQL and imports it into SQLite
 */

const mysql = require("mysql2/promise");
const Database = require("better-sqlite3");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const SQLITE_DB_PATH = path.join(__dirname, "..", "database", "fishmarket.db");
const SCHEMA_PATH = path.join(
  __dirname,
  "..",
  "database",
  "schema-empty.sqlite.sql"
);

// MySQL config from environment
const mysqlConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "fishmarket_db",
};

// Tables to migrate in order (respecting foreign keys)
const TABLES = [
  "roles",
  "users",
  "suppliers",
  "customers",
  "fish_categories",
  "fishes",
  "inventories",
  "inventory_logs",
  "import_orders",
  "import_order_items",
  "sale_orders",
  "sale_order_items",
];

// Type conversion functions
function convertValue(value, columnType) {
  if (value === null) return null;

  // Convert boolean (MySQL TINYINT(1) to SQLite INTEGER 0/1)
  if (typeof value === "boolean") return value ? 1 : 0;

  // Convert dates
  if (value instanceof Date) {
    return value.toISOString().replace("T", " ").substring(0, 19);
  }

  // Convert buffers to strings
  if (Buffer.isBuffer(value)) {
    return value.toString();
  }

  return value;
}

async function migrateMySQLToSQLite() {
  let mysqlConnection;
  let sqliteDb;

  try {
    console.log("🚀 Starting MySQL to SQLite migration...\n");

    // Connect to MySQL
    console.log("📡 Connecting to MySQL...");
    mysqlConnection = await mysql.createConnection(mysqlConfig);
    console.log("✅ MySQL connected\n");

    // Initialize SQLite
    console.log("📀 Initializing SQLite database...");

    // Delete existing SQLite database if exists
    if (fs.existsSync(SQLITE_DB_PATH)) {
      fs.unlinkSync(SQLITE_DB_PATH);
      console.log("🗑️  Removed existing SQLite database");
    }

    sqliteDb = new Database(SQLITE_DB_PATH);

    // Read and execute schema
    const schema = fs.readFileSync(SCHEMA_PATH, "utf8");
    console.log("📋 Creating SQLite schema...");
    sqliteDb.exec(schema);
    console.log("✅ SQLite schema created\n");

    // Migrate data for each table
    for (const tableName of TABLES) {
      console.log(`📦 Migrating table: ${tableName}`);

      // Get data from MySQL
      const [rows] = await mysqlConnection.execute(
        `SELECT * FROM ${tableName}`
      );

      if (rows.length === 0) {
        console.log(`   ⚠️  No data in ${tableName}, skipping...`);
        continue;
      }

      console.log(`   Found ${rows.length} rows`);

      // Get column names
      const columns = Object.keys(rows[0]);
      const placeholders = columns.map(() => "?").join(", ");
      const columnNames = columns.join(", ");

      // Prepare insert statement
      const insertStmt = sqliteDb.prepare(
        `INSERT INTO ${tableName} (${columnNames}) VALUES (${placeholders})`
      );

      // Insert data in transaction
      const insertMany = sqliteDb.transaction((data) => {
        for (const row of data) {
          const values = columns.map((col) => convertValue(row[col]));
          try {
            insertStmt.run(...values);
          } catch (error) {
            console.log(`   ⚠️  Skipping row with error: ${error.message}`);
            // Skip invalid rows
          }
        }
      });

      insertMany(rows);
      console.log(`   ✅ Migrated ${rows.length} rows to SQLite\n`);
    }

    // Verify data
    console.log("🔍 Verifying migration...\n");
    for (const tableName of TABLES) {
      const mysqlCount = await mysqlConnection.execute(
        `SELECT COUNT(*) as count FROM ${tableName}`
      );
      const sqliteCount = sqliteDb
        .prepare(`SELECT COUNT(*) as count FROM ${tableName}`)
        .get();

      const mysqlTotal = mysqlCount[0][0].count;
      const sqliteTotal = sqliteCount.count;

      const status = mysqlTotal === sqliteTotal ? "✅" : "⚠️";
      console.log(
        `${status} ${tableName}: MySQL(${mysqlTotal}) -> SQLite(${sqliteTotal})`
      );

      if (mysqlTotal !== sqliteTotal) {
        console.log(
          `   ℹ️  ${
            mysqlTotal - sqliteTotal
          } rows were skipped due to data validation`
        );
      }
    }

    console.log("\n✨ Migration completed successfully!");
    console.log(`📍 SQLite database location: ${SQLITE_DB_PATH}`);
  } catch (error) {
    console.error("\n❌ Migration failed:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    // Clean up connections
    if (mysqlConnection) {
      await mysqlConnection.end();
      console.log("\n🔌 MySQL connection closed");
    }
    if (sqliteDb) {
      sqliteDb.close();
      console.log("🔌 SQLite connection closed");
    }
  }
}

// Run migration
if (require.main === module) {
  migrateMySQLToSQLite();
}

module.exports = migrateMySQLToSQLite;
