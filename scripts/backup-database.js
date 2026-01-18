/**
 * Database Backup and Restore Utility
 * Sao lưu và khôi phục database cho Electron app
 */

const fs = require("fs");
const path = require("path");

// Get database path from args or use default
const dbPath =
  process.argv[2] || path.join(process.cwd(), "database", "fishmarket.db");
const backupDir = path.join(process.cwd(), "database", "backups");

function createBackup() {
  try {
    // Ensure backup directory exists
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Check if source database exists
    if (!fs.existsSync(dbPath)) {
      console.error(`❌ Database not found: ${dbPath}`);
      process.exit(1);
    }

    // Create backup filename with timestamp
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .slice(0, 19);
    const backupFileName = `fishmarket-backup-${timestamp}.db`;
    const backupPath = path.join(backupDir, backupFileName);

    // Copy database file
    fs.copyFileSync(dbPath, backupPath);

    console.log(`✅ Database backed up successfully!`);
    console.log(`📂 Source: ${dbPath}`);
    console.log(`💾 Backup: ${backupPath}`);
    console.log(
      `📊 Size: ${(fs.statSync(backupPath).size / 1024).toFixed(2)} KB`,
    );

    // Clean old backups (keep only last 10)
    cleanOldBackups();

    return backupPath;
  } catch (error) {
    console.error("❌ Backup failed:", error.message);
    process.exit(1);
  }
}

function restoreBackup(backupFile) {
  try {
    // Find backup file
    let backupPath;

    if (backupFile) {
      // Use specified backup file
      backupPath = path.isAbsolute(backupFile)
        ? backupFile
        : path.join(backupDir, backupFile);
    } else {
      // Use latest backup
      backupPath = getLatestBackup();
    }

    if (!fs.existsSync(backupPath)) {
      console.error(`❌ Backup file not found: ${backupPath}`);
      process.exit(1);
    }

    // Create backup of current database before restore
    if (fs.existsSync(dbPath)) {
      const preRestoreBackup = dbPath.replace(".db", "-pre-restore.db");
      fs.copyFileSync(dbPath, preRestoreBackup);
      console.log(`🔄 Current database backed up to: ${preRestoreBackup}`);
    }

    // Restore from backup
    fs.copyFileSync(backupPath, dbPath);

    console.log(`✅ Database restored successfully!`);
    console.log(`📂 Source: ${backupPath}`);
    console.log(`💾 Target: ${dbPath}`);
  } catch (error) {
    console.error("❌ Restore failed:", error.message);
    process.exit(1);
  }
}

function getLatestBackup() {
  if (!fs.existsSync(backupDir)) {
    console.error(`❌ Backup directory not found: ${backupDir}`);
    process.exit(1);
  }

  const backups = fs
    .readdirSync(backupDir)
    .filter((f) => f.endsWith(".db"))
    .map((f) => ({
      name: f,
      path: path.join(backupDir, f),
      time: fs.statSync(path.join(backupDir, f)).mtime.getTime(),
    }))
    .sort((a, b) => b.time - a.time);

  if (backups.length === 0) {
    console.error("❌ No backup files found");
    process.exit(1);
  }

  return backups[0].path;
}

function listBackups() {
  if (!fs.existsSync(backupDir)) {
    console.log("📁 No backups found");
    return;
  }

  const backups = fs
    .readdirSync(backupDir)
    .filter((f) => f.endsWith(".db"))
    .map((f) => ({
      name: f,
      path: path.join(backupDir, f),
      size: fs.statSync(path.join(backupDir, f)).size,
      date: fs.statSync(path.join(backupDir, f)).mtime,
    }))
    .sort((a, b) => b.date - a.date);

  if (backups.length === 0) {
    console.log("📁 No backups found");
    return;
  }

  console.log(`\n📁 Available backups (${backups.length}):\n`);
  backups.forEach((backup, index) => {
    console.log(`${index + 1}. ${backup.name}`);
    console.log(`   📅 Date: ${backup.date.toLocaleString()}`);
    console.log(`   📊 Size: ${(backup.size / 1024).toFixed(2)} KB`);
    console.log("");
  });
}

function cleanOldBackups(keepCount = 10) {
  if (!fs.existsSync(backupDir)) return;

  const backups = fs
    .readdirSync(backupDir)
    .filter((f) => f.endsWith(".db") && !f.includes("pre-restore"))
    .map((f) => ({
      name: f,
      path: path.join(backupDir, f),
      time: fs.statSync(path.join(backupDir, f)).mtime.getTime(),
    }))
    .sort((a, b) => b.time - a.time);

  if (backups.length > keepCount) {
    const toDelete = backups.slice(keepCount);
    toDelete.forEach((backup) => {
      fs.unlinkSync(backup.path);
      console.log(`🗑️  Deleted old backup: ${backup.name}`);
    });
  }
}

// Command line interface
const command = process.argv[3];

switch (command) {
  case "backup":
    createBackup();
    break;
  case "restore":
    const backupFile = process.argv[4];
    restoreBackup(backupFile);
    break;
  case "list":
    listBackups();
    break;
  default:
    console.log(`
📦 Database Backup & Restore Utility

Usage:
  node scripts/backup-database.js [db-path] backup           - Tạo backup mới
  node scripts/backup-database.js [db-path] restore [file]   - Khôi phục từ backup
  node scripts/backup-database.js [db-path] list             - Liệt kê các backup

Examples:
  node scripts/backup-database.js database/fishmarket.db backup
  node scripts/backup-database.js database/fishmarket.db restore
  node scripts/backup-database.js database/fishmarket.db list

Note: Nếu không chỉ định db-path, sẽ dùng: database/fishmarket.db
    `);
}
