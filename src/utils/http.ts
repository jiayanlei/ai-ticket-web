import axios from 'axios';
import type { AxiosError, AxiosResponse } from 'axios';

import { appSettings, envConfig } from '@/config';
import { logger } from '@/utils/logger';
import { removeStorageItem } from '@/utils/storage';
import { clearRefreshToken, clearToken, getToken } from '@/utils/token';

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  timestamp?: number;
}

export class ApiError<T = unknown> extends Error {
  code?: number;
  data?: T | null;
  timestamp?: number;
  status?: number;

  constructor(message: string, options: { code?: number; data?: T | null; timestamp?: number; status?: number } = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = options.code;
    this.data = options.data;
    this.timestamp = options.timestamp;
    this.status = options.status;
  }
}

function isAbsoluteUrl(url: string) {
  return /^[a-z][a-z\d+\-.]*:\/\//i.test(url);
}

function joinUrl(baseUrl: string, path = '') {
  if (!baseUrl) {
    return path;
  }

  if (!path) {
    return baseUrl;
  }

  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}

function removeApiPrefix(path: string) {
  if (!path.startsWith(envConfig.apiPrefix)) {
    return path;
  }

  return path.slice(envConfig.apiPrefix.length) || '/';
}

function createBaseURL() {
  if (envConfig.useProxy) {
    return envConfig.apiPrefix;
  }

  return joinUrl(envConfig.baseApi, envConfig.apiPrefix);
}

const apiBaseURL = createBaseURL();

function createApiUrl(path = '') {
  if (isAbsoluteUrl(path)) {
    return path;
  }

  return joinUrl(apiBaseURL, removeApiPrefix(path));
}

export const requestConfig = Object.freeze({
  apiPrefix: envConfig.apiPrefix,
  baseURL: apiBaseURL,
  timeout: envConfig.requestTimeout,
  uploadURL: createApiUrl(envConfig.uploadUrl),
  fileBaseURL: envConfig.fileBaseUrl || envConfig.baseApi,
});

export function resolveApiUrl(path = '') {
  return createApiUrl(path);
}

export function getUploadUrl() {
  return requestConfig.uploadURL;
}

export function resolveFileUrl(path: string) {
  if (!path || isAbsoluteUrl(path)) {
    return path;
  }

  return joinUrl(requestConfig.fileBaseURL, path);
}

function parseJsonWithLargeIntegerCompat(data: string) {
  if (!data) {
    return data;
  }

  try {
    return JSON.parse(data.replace(/(:\s*)(-?\d{16,})(\s*[,}\]])/g, '$1"$2"$3'));
  } catch {
    return data;
  }
}

function isApiResponse<T = unknown>(body: unknown): body is ApiResponse<T> {
  return Boolean(
    body &&
      typeof body === 'object' &&
      'code' in body &&
      'message' in body &&
      'data' in body,
  );
}

function clearAuthStorage() {
  clearToken();
  clearRefreshToken();
  removeStorageItem(appSettings.auth.userInfoKey);
}

function unwrapResponse<T = unknown>(response: AxiosResponse<ApiResponse<T> | T>): T {
  const body = response.data;

  if (!isApiResponse<T>(body)) {
    return body as T;
  }

  if (body.code !== 200) {
    if (body.code === 401) {
      clearAuthStorage();
    }

    throw new ApiError(body.message || '请求失败', {
      code: body.code,
      data: body.data,
      timestamp: body.timestamp,
      status: response.status,
    });
  }

  return body.data;
}

function normalizeAxiosError(error: AxiosError<ApiResponse<unknown>>) {
  const body = error.response?.data;

  if (isApiResponse(body)) {
    if (body.code === 401) {
      clearAuthStorage();
    }

    return new ApiError(body.message || error.message || '请求失败', {
      code: body.code,
      data: body.data,
      timestamp: body.timestamp,
      status: error.response?.status,
    });
  }

  return new ApiError(error.message || '网络请求失败', {
    status: error.response?.status,
  });
}

export const http = axios.create({
  baseURL: requestConfig.baseURL,
  timeout: requestConfig.timeout,
  transformResponse: [parseJsonWithLargeIntegerCompat],
});

http.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

http.interceptors.response.use(
  (response) => unwrapResponse(response),
  (error: unknown) => {
    logger.error('[HTTP Error]', error);

    if (axios.isAxiosError(error)) {
      return Promise.reject(normalizeAxiosError(error));
    }

    return Promise.reject(error);
  },
);
