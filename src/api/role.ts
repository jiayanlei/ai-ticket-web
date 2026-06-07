import type { ApiId, CommonStatus, Nullable, PageQuery, PageResult } from '@/api/types';
import { cleanPayload, cleanQuery, normalizePageResult } from '@/api/types';
import { envConfig } from '@/config';
import {
  createMockRole,
  deleteMockRole,
  getMockRoleDetail,
  getMockRoleList,
  updateMockRole,
} from '@/mock/system';
import { resolveMockResponse } from '@/mock/core';
import { http } from '@/utils/http';

export interface RoleQueryParams extends PageQuery {
  roleName?: string;
  roleCode?: string;
  status?: CommonStatus;
}

export interface RoleItem {
  id: ApiId;
  roleName: string;
  roleCode: string;
  sortOrder: number;
  status: CommonStatus;
  remark: Nullable<string>;
  createTime: string;
  updateTime: string;
}

export interface RolePayload {
  roleName: string;
  roleCode: string;
  sortOrder?: number;
  status?: CommonStatus;
  remark?: string;
}

export async function getRoleListApi(params: RoleQueryParams = {}): Promise<PageResult<RoleItem>> {
  if (envConfig.useMock) {
    const page = await resolveMockResponse(getMockRoleList(params));
    return normalizePageResult(page);
  }

  const page = await http.get<PageResult<RoleItem>, PageResult<RoleItem>>('/system/roles', {
    params: cleanQuery(params),
  });

  return normalizePageResult(page);
}

export function createRoleApi(data: RolePayload): Promise<ApiId> {
  if (envConfig.useMock) {
    return resolveMockResponse(createMockRole(data));
  }

  return http.post<ApiId, ApiId>('/system/roles', cleanPayload(data));
}

export function getRoleDetailApi(id: ApiId): Promise<RoleItem> {
  if (envConfig.useMock) {
    return resolveMockResponse(getMockRoleDetail(id));
  }

  return http.get<RoleItem, RoleItem>(`/system/roles/${id}`);
}

export function updateRoleApi(id: ApiId, data: RolePayload): Promise<void> {
  if (envConfig.useMock) {
    return resolveMockResponse(updateMockRole(id, data)).then(() => undefined);
  }

  return http.put<void, void>(`/system/roles/${id}`, cleanPayload(data));
}

export function deleteRoleApi(id: ApiId): Promise<void> {
  if (envConfig.useMock) {
    return resolveMockResponse(deleteMockRole(id)).then(() => undefined);
  }

  return http.delete<void, void>(`/system/roles/${id}`);
}
