import type { ApiId } from '@/api/types';
import { envConfig } from '@/config';
import { mockDownloadFile, mockUploadFile } from '@/mock/document';
import { resolveMockResponse } from '@/mock/core';
import { http } from '@/utils/http';

export interface UploadFileResult {
  id?: ApiId;
  url?: string;
  fileName?: string;
  originalName?: string;
  size?: number;
  contentType?: string;
}

export interface UploadFileOptions {
  url?: string;
  fieldName?: string;
  data?: Record<string, string | Blob>;
}

export function uploadFileApi(file: File, options: UploadFileOptions = {}): Promise<UploadFileResult> {
  if (envConfig.useMock) {
    return resolveMockResponse(mockUploadFile(file), 320);
  }

  const formData = new FormData();
  formData.append(options.fieldName || 'file', file);

  Object.entries(options.data ?? {}).forEach(([key, value]) => {
    formData.append(key, value);
  });

  return http.post<UploadFileResult, UploadFileResult>(options.url || '/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export function downloadFileApi(url: string): Promise<Blob> {
  if (envConfig.useMock) {
    return Promise.resolve(mockDownloadFile(url));
  }

  return http.get<Blob, Blob>(url, {
    responseType: 'blob',
  });
}
