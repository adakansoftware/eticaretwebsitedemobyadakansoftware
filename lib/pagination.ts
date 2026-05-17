export const DEFAULT_PAGE_SIZE = 12;

export function getPageValue(page?: string, fallback = 1) {
  const parsed = Number(page);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
}

export function getPageSizeValue(pageSize?: string, fallback = DEFAULT_PAGE_SIZE) {
  const parsed = Number(pageSize);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(Math.floor(parsed), 48);
}

export function getPagination(page: number, pageSize: number) {
  return {
    skip: (page - 1) * pageSize,
    take: pageSize
  };
}

export function getPaginationMeta(totalItems: number, page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages
  };
}
