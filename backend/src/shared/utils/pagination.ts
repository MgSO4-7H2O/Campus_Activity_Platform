export type PaginationParams = {
  page: number
  pageSize: number
}

export function parsePagination(query: Record<string, unknown>) {
  const rawPage = query.page
  const rawPageSize = query.pageSize
  const page = typeof rawPage === 'string' ? Number.parseInt(rawPage, 10) : 1
  const pageSize = typeof rawPageSize === 'string' ? Number.parseInt(rawPageSize, 10) : 20

  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 20,
  }
}

export function buildPaginationMeta(total: number, params: PaginationParams) {
  return {
    total,
    page: params.page,
    pageSize: params.pageSize,
  }
}
