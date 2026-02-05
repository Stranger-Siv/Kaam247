/**
 * Pagination helper for list endpoints.
 * - page: 1-based (default 1)
 * - limit: default 20, max 50
 */

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 20
const MAX_LIMIT = 50

/**
 * Parse and clamp pagination from query.
 * @param {object} query - req.query
 * @returns {{ page: number, limit: number, skip: number }}
 */
function parsePagination(query = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || DEFAULT_PAGE)
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || DEFAULT_LIMIT))
  const skip = (page - 1) * limit
  return { page, limit, skip }
}

/**
 * Build pagination metadata for response.
 * @param {number} page
 * @param {number} limit
 * @param {number} total
 * @param {number} itemsLength - length of the returned items array
 * @returns {{ page, limit, total, hasMore }}
 */
function paginationMeta(page, limit, total, itemsLength) {
  const hasMore = (page - 1) * limit + itemsLength < total
  return {
    page,
    limit,
    total,
    hasMore
  }
}

module.exports = {
  parsePagination,
  paginationMeta,
  DEFAULT_LIMIT,
  MAX_LIMIT
}
