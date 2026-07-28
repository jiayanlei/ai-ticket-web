import type { ApiId, PageQuery, PageResult } from '@/api/types';
import { cleanPayload, cleanQuery, normalizePageResult } from '@/api/types';
import { http } from '@/utils/http';

export type BusinessRecordStatus = '待处理' | '处理中' | '待审核' | '已完成' | '已暂停' | '已关闭';
export type BusinessRecordPriority = '低' | '中' | '高' | '紧急';

export interface BusinessRecord {
  id: ApiId;
  module: string;
  title: string;
  code: string;
  owner: string;
  customer: string;
  channel: string;
  status: BusinessRecordStatus;
  priority: BusinessRecordPriority;
  metric: string;
  risk: string;
  description: string;
  aiSuggestion: string;
  tags: string[];
  timeline: Array<{
    time: string;
    action: string;
    operator: string;
    content: string;
  }>;
  updateTime: string;
}

export interface BusinessRecordQueryParams extends PageQuery {
  module?: string;
  keyword?: string;
  status?: BusinessRecordStatus;
}

export type BusinessRecordPayload = Pick<
  BusinessRecord,
  'module' | 'title' | 'owner' | 'customer' | 'channel' | 'status' | 'priority' | 'metric' | 'risk' | 'description' | 'aiSuggestion'
> & {
  tags?: string[];
};

export async function getBusinessRecordList(params: BusinessRecordQueryParams = {}) {
  const page = await http.get<PageResult<BusinessRecord>, PageResult<BusinessRecord>>('/business/records', {
    params: cleanQuery(params),
  });
  return normalizePageResult(page);
}

export function getBusinessRecordDetail(id: ApiId) {
  return http.get<BusinessRecord, BusinessRecord>(`/business/records/${id}`);
}

export function createBusinessRecord(payload: BusinessRecordPayload) {
  return http.post<ApiId, ApiId>('/business/records', cleanPayload(payload));
}

export function updateBusinessRecord(id: ApiId, payload: BusinessRecordPayload) {
  return http.put<void, void>(`/business/records/${id}`, cleanPayload(payload));
}

export function updateBusinessRecordStatus(id: ApiId, status: BusinessRecordStatus) {
  return http.patch<void, void>(`/business/records/${id}/status`, { status });
}

export function deleteBusinessRecord(id: ApiId) {
  return http.delete<void, void>(`/business/records/${id}`);
}
