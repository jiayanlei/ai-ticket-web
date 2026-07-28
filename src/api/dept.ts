import type { ApiId, CommonStatus, Nullable } from '@/api/types';
import { cleanPayload, cleanQuery } from '@/api/types';
import { http } from '@/utils/http';

export interface DeptQueryParams {
  deptName?: string;
  deptCode?: string;
  status?: CommonStatus;
}

export interface DeptItem {
  id: ApiId;
  parentId: ApiId;
  deptName: string;
  deptCode: string;
  leader: Nullable<string>;
  phone: Nullable<string>;
  email: Nullable<string>;
  sortOrder: number;
  status: CommonStatus;
  createTime: string;
  updateTime: string;
}

export interface DeptPayload {
  parentId?: ApiId;
  deptName: string;
  deptCode: string;
  leader?: string;
  phone?: string;
  email?: string;
  sortOrder?: number;
  status?: CommonStatus;
}

export function getDeptListApi(params: DeptQueryParams = {}): Promise<DeptItem[]> {
  return http.get<DeptItem[], DeptItem[]>('/system/depts', {
    params: cleanQuery(params),
  });
}

export function createDeptApi(data: DeptPayload): Promise<ApiId> {
  return http.post<ApiId, ApiId>('/system/depts', cleanPayload(data));
}

export function getDeptDetailApi(id: ApiId): Promise<DeptItem> {
  return http.get<DeptItem, DeptItem>(`/system/depts/${id}`);
}

export function updateDeptApi(id: ApiId, data: DeptPayload): Promise<void> {
  return http.put<void, void>(`/system/depts/${id}`, cleanPayload(data));
}

export function deleteDeptApi(id: ApiId): Promise<void> {
  return http.delete<void, void>(`/system/depts/${id}`);
}
