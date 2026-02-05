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
 * @returns {{ page, limit, total, hasMore, pages }}
 */
function paginationMeta(page, limit, total, itemsLength) {
  const totalNum = Number(total)
  const limitNum = Number(limit) || 1
  const pageNum = Number(page) || 1
  const hasMore = (pageNum - 1) * limitNum + (itemsLength || 0) < totalNum
  const pages = limitNum > 0 ? Math.max(1, Math.ceil(totalNum / limitNum)) : 1
  return {
    page: pageNum,
    limit: limitNum,
    total: totalNum,
    hasMore,
    pages
  }
}

module.exports = {
  parsePagination,
  paginationMeta,
  DEFAULT_LIMIT,
  MAX_LIMIT
}
