import type { ApiId, CommonStatus, Nullable, PageQuery, PageResult } from '@/api/types';
import { cleanPayload, cleanQuery, normalizePageResult } from '@/api/types';
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
  const page = await http.get<PageResult<RoleItem>, PageResult<RoleItem>>('/system/roles', {
    params: cleanQuery(params),
  });

  return normalizePageResult(page);
}

export function createRoleApi(data: RolePayload): Promise<ApiId> {
  return http.post<ApiId, ApiId>('/system/roles', cleanPayload(data));
}

export function getRoleDetailApi(id: ApiId): Promise<RoleItem> {
  return http.get<RoleItem, RoleItem>(`/system/roles/${id}`);
}

export function updateRoleApi(id: ApiId, data: RolePayload): Promise<void> {
  return http.put<void, void>(`/system/roles/${id}`, cleanPayload(data));
}

export function deleteRoleApi(id: ApiId): Promise<void> {
  return http.delete<void, void>(`/system/roles/${id}`);
}
