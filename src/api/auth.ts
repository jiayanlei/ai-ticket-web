import type { ApiId, CommonStatus, Nullable } from '@/api/types';
import type { MenuItem } from '@/api/menu';
import { envConfig } from '@/config';
import { mockGetUserInfo, mockLogin, mockLogout } from '@/mock/auth';
import { resolveMockResponse } from '@/mock/core';
import { http } from '@/utils/http';

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResult {
  id: ApiId;
  userId: ApiId;
  username: string;
  nickname: string;
  tokenName: string;
  tokenValue: string;
  tokenPrefix: string;
  token: string;
  roles: string[];
  permissions: string[];
  email?: Nullable<string>;
  mobile?: Nullable<string>;
  deptId?: Nullable<ApiId>;
  deptName?: Nullable<string>;
  status?: CommonStatus;
  jobNo?: string;
  menus?: MenuItem[];
}

export type UserInfo = LoginResult;

interface LoginVO {
  userId: ApiId;
  username: string;
  nickname: string;
  tokenName?: string;
  tokenValue?: string;
  tokenPrefix?: string;
  roles?: string[];
  permissions?: string[];
  email?: Nullable<string>;
  mobile?: Nullable<string>;
  deptId?: Nullable<ApiId>;
  deptName?: Nullable<string>;
  status?: CommonStatus;
  jobNo?: string;
  menus?: MenuItem[];
}

export async function loginApi(params: LoginParams): Promise<LoginResult> {
  if (envConfig.useMock) {
    const response = mockLogin(params);
    return response instanceof Promise ? response : resolveMockResponse(response);
  }

  const data = await http.post<LoginVO, LoginVO>('/auth/login', params);
  return normalizeLoginVO(data);
}

export async function logoutApi(): Promise<void> {
  if (envConfig.useMock) {
    await resolveMockResponse(mockLogout(), 120);
    return;
  }

  await http.post<void, void>('/auth/logout');
}

export async function getUserInfoApi(): Promise<UserInfo> {
  if (envConfig.useMock) {
    return resolveMockResponse(mockGetUserInfo());
  }

  const data = await http.get<LoginVO, LoginVO>('/auth/me');
  return normalizeLoginVO(data);
}

function normalizeLoginVO(data: LoginVO): LoginResult {
  return {
    id: data.userId,
    userId: data.userId,
    username: data.username,
    nickname: data.nickname,
    tokenName: data.tokenName || 'Authorization',
    tokenValue: data.tokenValue || '',
    tokenPrefix: data.tokenPrefix || 'Bearer',
    token: data.tokenValue || '',
    roles: data.roles ?? [],
    permissions: data.permissions ?? [],
    email: data.email ?? null,
    mobile: data.mobile ?? null,
    deptId: data.deptId ?? null,
    deptName: data.deptName ?? null,
    status: data.status,
    jobNo: data.jobNo,
    menus: data.menus,
  };
}
