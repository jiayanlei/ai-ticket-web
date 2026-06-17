import { envConfig } from '@/config';
import {
  createMockDocumentCenterItem,
  deleteMockDocumentCenterItem,
  getMockDocumentCenterList,
  getMockDocumentDirectories,
  type CreateDocumentCenterPayload,
  type DocumentCenterItem,
  type DocumentDirectoryItem,
} from '@/mock/document';
import { resolveMockResponse } from '@/mock/core';
import { http } from '@/utils/http';

export type { CreateDocumentCenterPayload, DocumentCenterItem, DocumentDirectoryItem } from '@/mock/document';

export function getDocumentCenterListApi(): Promise<DocumentCenterItem[]> {
  if (envConfig.useMock) {
    return resolveMockResponse(getMockDocumentCenterList());
  }

  return http.get<DocumentCenterItem[], DocumentCenterItem[]>('/documents/records');
}

export function getDocumentDirectoriesApi(): Promise<DocumentDirectoryItem[]> {
  if (envConfig.useMock) {
    return resolveMockResponse(getMockDocumentDirectories());
  }

  return http.get<DocumentDirectoryItem[], DocumentDirectoryItem[]>('/documents/directories');
}

export function createDocumentCenterItemApi(payload: CreateDocumentCenterPayload): Promise<DocumentCenterItem> {
  if (envConfig.useMock) {
    return resolveMockResponse(createMockDocumentCenterItem(payload));
  }

  return http.post<DocumentCenterItem, DocumentCenterItem>('/documents/records', payload);
}

export function deleteDocumentCenterItemApi(id: string): Promise<void> {
  if (envConfig.useMock) {
    return resolveMockResponse(deleteMockDocumentCenterItem(id));
  }

  return http.delete<void, void>(`/documents/records/${id}`);
}
