import type { PageQuery, PageResult } from '@/api/types';
import { ApiError, type ApiResponse } from '@/utils/http';

const DEFAULT_DELAY = 180;

export function cloneMock<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}

export function createMockResponse<T>(data: T, message = 'success'): ApiResponse<T> {
  return {
    code: 200,
    message,
    data,
    timestamp: Date.now(),
  };
}

export function resolveMockResponse<T>(response: ApiResponse<T>, delay = DEFAULT_DELAY): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      resolve(cloneMock(response.data));
    }, delay);
  });
}

export function rejectMockResponse(message: string, code = 500, delay = DEFAULT_DELAY): Promise<never> {
  return new Promise((_, reject) => {
    window.setTimeout(() => {
      reject(
        new ApiError(message, {
          code,
          timestamp: Date.now(),
        }),
      );
    }, delay);
  });
}

export function paginateMock<T>(list: T[], params: PageQuery = {}): PageResult<T> {
  const pageNum = Number(params.pageNum ?? 1);
  const pageSize = Number(params.pageSize ?? 10);
  const start = Math.max(pageNum - 1, 0) * pageSize;

  return {
    records: cloneMock(list.slice(start, start + pageSize)),
    total: list.length,
    pageNum,
    pageSize,
  };
}

export function createMockId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function nowText(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

export function matchesKeyword(textParts: Array<string | number | null | undefined>, keyword?: string) {
  const normalizedKeyword = keyword?.trim().toLowerCase();

  if (!normalizedKeyword) {
    return true;
  }

  return textParts
    .filter((item) => item !== null && item !== undefined)
    .join(' ')
    .toLowerCase()
    .includes(normalizedKeyword);
}

export function sortByTimeDesc<T>(list: T[], selector: (item: T) => string) {
  return [...list].sort((prev, next) => selector(next).localeCompare(selector(prev)));
}
