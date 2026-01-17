/**
 * Database Configuration - SQLite Only
 * All environments (web dev, Electron) now use SQLite for simplicity and portability.
 */
require("dotenv").config();

console.log("🔧 Using SQLite database for all environments");
const pool = require("./db.sqlite");

module.exports = pool;
