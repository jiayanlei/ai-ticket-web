import { http } from '@/utils/http';

export interface DocumentCenterItem {
  id: string;
  fileName: string;
  category: string;
  owner: string;
  size: string;
  format: string;
  parseStatus: 'UPLOADING' | 'PARSING' | 'SUCCESS' | 'FAILED';
  updateTime: string;
  summary: string;
}

export interface DocumentDirectoryItem {
  key: string;
  title: string;
  description: string;
}

export interface CreateDocumentCenterPayload {
  fileName: string;
  category: string;
  owner?: string;
  size?: string;
  format?: string;
}

export function getDocumentCenterListApi(): Promise<DocumentCenterItem[]> {
  return http.get<DocumentCenterItem[], DocumentCenterItem[]>('/documents/records');
}

export function getDocumentDirectoriesApi(): Promise<DocumentDirectoryItem[]> {
  return http.get<DocumentDirectoryItem[], DocumentDirectoryItem[]>('/documents/directories');
}

export function createDocumentCenterItemApi(payload: CreateDocumentCenterPayload): Promise<DocumentCenterItem> {
  return http.post<DocumentCenterItem, DocumentCenterItem>('/documents/records', payload);
}

export function deleteDocumentCenterItemApi(id: string): Promise<void> {
  return http.delete<void, void>(`/documents/records/${id}`);
}
