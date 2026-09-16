import type { PaginatedResult, PaginationQuery } from "@ai-digital-passport/shared-types";

// API Design Rule (spec 04 Section 9): paginate large collections.
export function pageSkipTake(params: PaginationQuery): { skip: number; take: number } {
  return { skip: (params.page - 1) * params.pageSize, take: params.pageSize };
}

export function toPaginatedResult<T>(items: T[], total: number, params: PaginationQuery): PaginatedResult<T> {
  return { items, page: params.page, pageSize: params.pageSize, total };
}
