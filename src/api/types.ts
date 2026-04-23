export type ApiId = string | number;
export type Nullable<T> = T | null;
export type CommonStatus = 'ENABLED' | 'DISABLED';

export interface PageQuery {
  pageNum?: number;
  pageSize?: number;
}

export interface PageResult<T> {
  records: T[];
  total: number;
  pageNum: number;
  pageSize: number;
}

export function cleanQuery<T extends object>(params?: T): Partial<T> {
  if (!params) {
    return {};
  }

  const result: Partial<T> = {};

  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      result[key as keyof T] = value as T[keyof T];
    }
  });

  return result;
}

export function cleanPayload<T extends object>(payload: T): Partial<T> {
  const result: Partial<T> = {};

  Object.entries(payload as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      result[key as keyof T] = value as T[keyof T];
    }
  });

  return result;
}

export function normalizePageResult<T>(page?: Partial<PageResult<T>> | null): PageResult<T> {
  return {
    records: Array.isArray(page?.records) ? page.records : [],
    total: Number(page?.total ?? 0),
    pageNum: Number(page?.pageNum ?? 1),
    pageSize: Number(page?.pageSize ?? 10),
  };
}
