import type { ApiId, PageQuery, PageResult } from '@/api/types';
import { cleanPayload, cleanQuery, normalizePageResult } from '@/api/types';
import { envConfig } from '@/config';
import {
  createMockKnowledgeDocument,
  deleteMockKnowledgeDocument,
  getMockKnowledgeCanvasNodeDetail,
  getMockKnowledgeCanvasTotal,
  getMockKnowledgeCanvasTree,
  getMockKnowledgeCategoryTree,
  getMockKnowledgeDocumentDetail,
  getMockKnowledgeDocumentList,
  updateMockKnowledgeDocument,
} from '@/mock/knowledge';
import { resolveMockResponse } from '@/mock/core';
import { http } from '@/utils/http';

export type KnowledgeDocumentStatus = 'DRAFT' | 'PUBLISHED' | 'OFFLINE';

export interface KnowledgeCategoryNode {
  id: ApiId;
  parentId: ApiId | null;
  title: string;
  sort: number;
  documentCount?: number;
  children?: KnowledgeCategoryNode[];
}

export interface KnowledgeDocumentQueryParams extends PageQuery {
  keyword?: string;
  categoryId?: ApiId;
  status?: KnowledgeDocumentStatus;
}

export interface KnowledgeDocumentItem {
  id: ApiId;
  categoryId: ApiId;
  categoryName: string;
  title: string;
  summary: string;
  content: string;
  status: KnowledgeDocumentStatus;
  tags: string[];
  version: string;
  owner: string;
  viewCount: number;
  createTime: string;
  updateTime: string;
}

export interface KnowledgeDocumentPayload {
  categoryId: ApiId;
  title: string;
  summary: string;
  content: string;
  status: KnowledgeDocumentStatus;
  tags?: string[];
  owner?: string;
}

export type KnowledgeCanvasNodeType = 'category' | 'topic' | 'question' | 'summary';
export type KnowledgeCanvasProcessStatus = 'published' | 'draft' | 'offline';
type CommonCanvasStatus = 'enabled' | 'disabled';

export interface KnowledgeCanvasLink {
  name: string;
  url: string;
}

export interface KnowledgeCanvasVersion {
  version: string;
  updatedAt: string;
  updatedBy?: string;
  status?: KnowledgeCanvasProcessStatus;
  remark?: string;
}

export interface KnowledgeCanvasNode {
  id: ApiId;
  parentId?: ApiId | null;
  title: string;
  type: KnowledgeCanvasNodeType;
  isSummary?: boolean;
  relationType?: 'summary';
  summarySourceNodeIds?: ApiId[];
  summarySourceNodes?: Array<Pick<KnowledgeCanvasNode, 'id' | 'title' | 'type'>>;
  sort: number;
  status: CommonCanvasStatus;
  processStatus?: KnowledgeCanvasProcessStatus;
  processStatusLabel?: string;
  summary: string;
  content: string;
  script: string;
  tip: string;
  help: string;
  policy: string;
  tags: string[];
  links: KnowledgeCanvasLink[];
  versions: KnowledgeCanvasVersion[];
  updatedAt: string;
  updatedBy: string;
  children?: KnowledgeCanvasNode[];
  summaryGroups?: KnowledgeCanvasNode[];
}

export function getKnowledgeCategoryTreeApi(): Promise<KnowledgeCategoryNode[]> {
  if (envConfig.useMock) {
    return resolveMockResponse(getMockKnowledgeCategoryTree());
  }

  return http.get<KnowledgeCategoryNode[], KnowledgeCategoryNode[]>('/knowledge/categories/tree');
}

export async function getKnowledgeDocumentListApi(
  params: KnowledgeDocumentQueryParams = {},
): Promise<PageResult<KnowledgeDocumentItem>> {
  if (envConfig.useMock) {
    const page = await resolveMockResponse(getMockKnowledgeDocumentList(params));
    return normalizePageResult(page);
  }

  const page = await http.get<PageResult<KnowledgeDocumentItem>, PageResult<KnowledgeDocumentItem>>(
    '/knowledge/documents',
    {
      params: cleanQuery(params),
    },
  );

  return normalizePageResult(page);
}

export function getKnowledgeDocumentDetailApi(id: ApiId): Promise<KnowledgeDocumentItem> {
  if (envConfig.useMock) {
    return resolveMockResponse(getMockKnowledgeDocumentDetail(id));
  }

  return http.get<KnowledgeDocumentItem, KnowledgeDocumentItem>(`/knowledge/documents/${id}`);
}

export function createKnowledgeDocumentApi(payload: KnowledgeDocumentPayload): Promise<ApiId> {
  if (envConfig.useMock) {
    return resolveMockResponse(createMockKnowledgeDocument(payload));
  }

  return http.post<ApiId, ApiId>('/knowledge/documents', cleanPayload(payload));
}

export function updateKnowledgeDocumentApi(id: ApiId, payload: KnowledgeDocumentPayload): Promise<void> {
  if (envConfig.useMock) {
    return resolveMockResponse(updateMockKnowledgeDocument(id, payload)).then(() => undefined);
  }

  return http.put<void, void>(`/knowledge/documents/${id}`, cleanPayload(payload));
}

export function deleteKnowledgeDocumentApi(id: ApiId): Promise<void> {
  if (envConfig.useMock) {
    return resolveMockResponse(deleteMockKnowledgeDocument(id)).then(() => undefined);
  }

  return http.delete<void, void>(`/knowledge/documents/${id}`);
}

export function getKnowledgeCanvasTreeApi(): Promise<KnowledgeCanvasNode[]> {
  if (envConfig.useMock) {
    return resolveMockResponse(getMockKnowledgeCanvasTree());
  }

  return http.get<KnowledgeCanvasNode[], KnowledgeCanvasNode[]>('/knowledge/canvas/tree');
}

export async function getKnowledgeCanvasTotalApi(): Promise<number> {
  if (envConfig.useMock) {
    return resolveMockResponse(getMockKnowledgeCanvasTotal());
  }

  const data = await http.get<{ total: number }, { total: number }>('/knowledge/canvas/total');
  return Number(data.total ?? 0);
}

export function getKnowledgeCanvasNodeDetailApi(id: ApiId): Promise<KnowledgeCanvasNode> {
  if (envConfig.useMock) {
    return resolveMockResponse(getMockKnowledgeCanvasNodeDetail(id));
  }

  return http.get<KnowledgeCanvasNode, KnowledgeCanvasNode>(`/knowledge/canvas/nodes/${id}`);
}
