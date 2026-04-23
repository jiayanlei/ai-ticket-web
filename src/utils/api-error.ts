import { ApiError } from '@/utils/http';

export function getErrorMessage(error: unknown, fallback = '操作失败') {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
}
