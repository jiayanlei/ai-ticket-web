import { envConfig } from '@/config';
import { getMockDocumentCenterList, type DocumentCenterItem } from '@/mock/document';
import { resolveMockResponse } from '@/mock/core';
import { http } from '@/utils/http';

export type { DocumentCenterItem } from '@/mock/document';

export function getDocumentCenterListApi(): Promise<DocumentCenterItem[]> {
  if (envConfig.useMock) {
    return resolveMockResponse(getMockDocumentCenterList());
  }

  return http.get<DocumentCenterItem[], DocumentCenterItem[]>('/documents/records');
}
