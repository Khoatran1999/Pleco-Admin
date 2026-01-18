/**
 * Supabase Query Helpers
 * Utility functions to simplify Supabase queries
 */

/**
 * Handle Supabase response and throw error if exists
 * @param {Object} response - Supabase response object
 * @returns {any} data from response
 */
function handleResponse(response) {
  const { data, error } = response;

  if (error) {
    // Create a proper error object
    const err = new Error(error.message);
    err.code = error.code;
    err.details = error.details;
    err.hint = error.hint;
    throw err;
  }

  return data;
}

/**
 * Execute a query with error handling
 * @param {Function} queryFn - Async function that returns Supabase query
 * @returns {Promise<any>} Query result
 */
async function executeQuery(queryFn) {
  try {
    const response = await queryFn();
    return handleResponse(response);
  } catch (error) {
    console.error("Query error:", error);
    throw error;
  }
}

/**
 * Build filter query from filter object
 * @param {Object} query - Supabase query builder
 * @param {Object} filters - Filter conditions
 * @returns {Object} Query with filters applied
 */
function applyFilters(query, filters = {}) {
  let filteredQuery = query;

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      if (typeof value === "object" && value.operator) {
        // Advanced filter with operator
        switch (value.operator) {
          case "like":
            filteredQuery = filteredQuery.like(key, `%${value.value}%`);
            break;
          case "ilike":
            filteredQuery = filteredQuery.ilike(key, `%${value.value}%`);
            break;
          case "gt":
            filteredQuery = filteredQuery.gt(key, value.value);
            break;
          case "gte":
            filteredQuery = filteredQuery.gte(key, value.value);
            break;
          case "lt":
            filteredQuery = filteredQuery.lt(key, value.value);
            break;
          case "lte":
            filteredQuery = filteredQuery.lte(key, value.value);
            break;
          case "in":
            filteredQuery = filteredQuery.in(key, value.value);
            break;
          default:
            filteredQuery = filteredQuery.eq(key, value.value);
        }
      } else {
        // Simple equality filter
        filteredQuery = filteredQuery.eq(key, value);
      }
    }
  });

  return filteredQuery;
}

/**
 * Apply pagination to query
 * @param {Object} query - Supabase query builder
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @returns {Object} Query with pagination
 */
function applyPagination(query, page = 1, limit = 10) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  return query.range(from, to);
}

/**
 * Apply sorting to query
 * @param {Object} query - Supabase query builder
 * @param {string} column - Column to sort by
 * @param {boolean} ascending - Sort direction
 * @returns {Object} Query with sorting
 */
function applySort(query, column = "id", ascending = true) {
  return query.order(column, { ascending });
}

/**
 * Soft delete helper (sets is_active to false)
 * @param {Object} supabase - Supabase client
 * @param {string} table - Table name
 * @param {number} id - Record ID
 * @returns {Promise<any>} Update result
 */
async function softDelete(supabase, table, id) {
  return executeQuery(() =>
    supabase.from(table).update({ is_active: false }).eq("id", id),
  );
}

/**
 * Get count of records with optional filters
 * @param {Object} supabase - Supabase client
 * @param {string} table - Table name
 * @param {Object} filters - Optional filters
 * @returns {Promise<number>} Count
 */
async function getCount(supabase, table, filters = {}) {
  let query = supabase.from(table).select("*", { count: "exact", head: true });

  query = applyFilters(query, filters);

  const { count, error } = await query;

  if (error) throw error;
  return count;
}

module.exports = {
  handleResponse,
  executeQuery,
  applyFilters,
  applyPagination,
  applySort,
  softDelete,
  getCount,
};
