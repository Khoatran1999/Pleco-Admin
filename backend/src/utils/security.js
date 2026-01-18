/**
 * Security Utilities
 * Input sanitization and validation helpers
 */

/**
 * Sanitize input for PostgREST filter strings
 * Removes/escapes characters that could be used for injection
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeForPostgrest(input) {
  if (typeof input !== "string") return input;
  if (input === null || input === undefined) return "";

  // Remove or escape dangerous characters for PostgREST filters
  // These characters have special meaning in PostgREST filter syntax
  return input
    .replace(/\\/g, "") // backslashes
    .replace(/"/g, "") // double quotes
    .replace(/'/g, "") // single quotes
    .replace(/,/g, "") // commas (filter separator)
    .replace(/\(/g, "") // parentheses
    .replace(/\)/g, "")
    .replace(/\./g, "") // dots (can be used for column access)
    .replace(/;/g, "") // semicolons
    .replace(/--/g, "") // SQL comments
    .replace(/\/\*/g, "") // SQL block comments
    .replace(/\*\//g, "")
    .trim();
}

/**
 * Sanitize input for LIKE/ILIKE queries
 * Escapes wildcard characters
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized string safe for LIKE queries
 */
function sanitizeForLike(input) {
  if (typeof input !== "string") return input;
  if (input === null || input === undefined) return "";

  // Escape LIKE wildcards
  return input.replace(/%/g, "\\%").replace(/_/g, "\\_").trim();
}

/**
 * Validate and sanitize email format
 * @param {string} email - Email to validate
 * @returns {string|null} Sanitized email or null if invalid
 */
function sanitizeEmail(email) {
  if (typeof email !== "string") return null;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const trimmed = email.trim().toLowerCase();

  if (!emailRegex.test(trimmed)) return null;
  if (trimmed.length > 254) return null; // RFC 5321

  return trimmed;
}

/**
 * Validate and sanitize username
 * @param {string} username - Username to validate
 * @returns {string|null} Sanitized username or null if invalid
 */
function sanitizeUsername(username) {
  if (typeof username !== "string") return null;

  // Only allow alphanumeric, underscore, hyphen
  const cleaned = username.trim().replace(/[^a-zA-Z0-9_-]/g, "");

  if (cleaned.length < 3 || cleaned.length > 50) return null;

  return cleaned;
}

/**
 * Validate and sanitize integer ID
 * @param {any} id - ID to validate
 * @returns {number|null} Parsed integer or null if invalid
 */
function sanitizeId(id) {
  const parsed = parseInt(id, 10);
  if (isNaN(parsed) || parsed < 1) return null;
  return parsed;
}

/**
 * Sanitize general text input
 * @param {string} text - Text to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized text
 */
function sanitizeText(text, maxLength = 1000) {
  if (typeof text !== "string") return "";

  return text
    .trim()
    .substring(0, maxLength)
    .replace(/<[^>]*>/g, ""); // Remove HTML tags
}

/**
 * Validate date string format
 * @param {string} dateStr - Date string to validate
 * @returns {string|null} Valid date string or null
 */
function sanitizeDate(dateStr) {
  if (typeof dateStr !== "string") return null;

  // Check ISO date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) return null;

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;

  return dateStr;
}

/**
 * Sanitize numeric value
 * @param {any} value - Value to sanitize
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number|null} Sanitized number or null if invalid
 */
function sanitizeNumber(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
  const num = parseFloat(value);
  if (isNaN(num)) return null;
  if (num < min || num > max) return null;
  return num;
}

module.exports = {
  sanitizeForPostgrest,
  sanitizeForLike,
  sanitizeEmail,
  sanitizeUsername,
  sanitizeId,
  sanitizeText,
  sanitizeDate,
  sanitizeNumber,
};
