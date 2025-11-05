// utils/paginationHelper.js
// Helper functions for pagination

/**
 * Parse pagination parameters from query string
 * @param {object} query - Express request query object
 * @returns {{page: number, limit: number, offset: number}}
 */
export const parsePaginationParams = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(query.limit) || 10)); // Max 100 items per page
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

/**
 * Calculate pagination metadata
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @returns {object} - Pagination metadata
 */
export const calculatePagination = (page, limit, total) => {
  const pageInt = parseInt(page);
  const limitInt = parseInt(limit);
  const totalPages = Math.ceil(total / limitInt);

  return {
    currentPage: pageInt,
    totalPages,
    totalItems: total,
    itemsPerPage: limitInt,
    hasNextPage: pageInt < totalPages,
    hasPreviousPage: pageInt > 1
  };
};

