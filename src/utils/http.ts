import axios from 'axios';

import { envConfig } from '@/config';
import { logger } from '@/utils/logger';
import { getToken } from '@/utils/token';

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

export const http = axios.create({
  baseURL: requestConfig.baseURL,
  timeout: requestConfig.timeout,
});

http.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

http.interceptors.response.use(
  (response) => response.data,
  (error: unknown) => {
    logger.error('[HTTP Error]', error);
    return Promise.reject(error);
  },
);
