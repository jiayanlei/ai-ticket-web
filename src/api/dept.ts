import type { ApiId, CommonStatus, Nullable } from '@/api/types';
import { cleanPayload, cleanQuery } from '@/api/types';
import { envConfig } from '@/config';
import {
  createMockDept,
  deleteMockDept,
  getMockDeptDetail,
  getMockDeptList,
  updateMockDept,
} from '@/mock/system';
import { resolveMockResponse } from '@/mock/core';
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
  if (envConfig.useMock) {
    return resolveMockResponse(getMockDeptList(params));
  }

  return http.get<DeptItem[], DeptItem[]>('/system/depts', {
    params: cleanQuery(params),
  });
}

export function createDeptApi(data: DeptPayload): Promise<ApiId> {
  if (envConfig.useMock) {
    return resolveMockResponse(createMockDept(data));
  }

  return http.post<ApiId, ApiId>('/system/depts', cleanPayload(data));
}

export function getDeptDetailApi(id: ApiId): Promise<DeptItem> {
  if (envConfig.useMock) {
    return resolveMockResponse(getMockDeptDetail(id));
  }

  return http.get<DeptItem, DeptItem>(`/system/depts/${id}`);
}

export function updateDeptApi(id: ApiId, data: DeptPayload): Promise<void> {
  if (envConfig.useMock) {
    return resolveMockResponse(updateMockDept(id, data)).then(() => undefined);
  }

  return http.put<void, void>(`/system/depts/${id}`, cleanPayload(data));
}

export function deleteDeptApi(id: ApiId): Promise<void> {
  if (envConfig.useMock) {
    return resolveMockResponse(deleteMockDept(id)).then(() => undefined);
  }

  return http.delete<void, void>(`/system/depts/${id}`);
}
