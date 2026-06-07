import type { ApiId, CommonStatus, Nullable, PageQuery, PageResult } from '@/api/types';
import { cleanPayload, cleanQuery, normalizePageResult } from '@/api/types';
import { envConfig } from '@/config';
import {
  createMockUser,
  deleteMockUser,
  getMockUserDetail,
  getMockUserList,
  updateMockUser,
} from '@/mock/system';
import { resolveMockResponse } from '@/mock/core';
import { http } from '@/utils/http';

export interface UserQueryParams extends PageQuery {
  username?: string;
  nickname?: string;
  deptId?: ApiId;
  status?: CommonStatus;
}

export interface UserItem {
  id: ApiId;
  username: string;
  nickname: string;
  email: Nullable<string>;
  mobile: Nullable<string>;
  avatar: Nullable<string>;
  deptId: Nullable<ApiId>;
  status: CommonStatus;
  lastLoginTime: Nullable<string>;
  createTime: string;
  updateTime: string;
  jobNo?: string;
  deptName?: string;
  roleCodes?: string[];
  roleNames?: string[];
}

export interface CreateUserPayload {
  username: string;
  password: string;
  nickname: string;
  email?: string;
  mobile?: string;
  avatar?: string;
  deptId?: ApiId;
  status?: CommonStatus;
}

export interface UpdateUserPayload {
  nickname: string;
  email?: string;
  mobile?: string;
  avatar?: string;
  deptId?: ApiId;
  status?: CommonStatus;
}

export async function getUserListApi(params: UserQueryParams = {}): Promise<PageResult<UserItem>> {
  if (envConfig.useMock) {
    const page = await resolveMockResponse(getMockUserList(params));
    return normalizePageResult(page);
  }

  const page = await http.get<PageResult<UserItem>, PageResult<UserItem>>('/system/users', {
    params: cleanQuery(params),
  });

  return normalizePageResult(page);
}

export function createUserApi(data: CreateUserPayload): Promise<ApiId> {
  if (envConfig.useMock) {
    return resolveMockResponse(createMockUser(data));
  }

  return http.post<ApiId, ApiId>('/system/users', cleanPayload(data));
}

export function getUserDetailApi(id: ApiId): Promise<UserItem> {
  if (envConfig.useMock) {
    return resolveMockResponse(getMockUserDetail(id));
  }

  return http.get<UserItem, UserItem>(`/system/users/${id}`);
}

export function updateUserApi(id: ApiId, data: UpdateUserPayload): Promise<void> {
  if (envConfig.useMock) {
    return resolveMockResponse(updateMockUser(id, data)).then(() => undefined);
  }

  return http.put<void, void>(`/system/users/${id}`, cleanPayload(data));
}

export function deleteUserApi(id: ApiId): Promise<void> {
  if (envConfig.useMock) {
    return resolveMockResponse(deleteMockUser(id)).then(() => undefined);
  }

  return http.delete<void, void>(`/system/users/${id}`);
}
