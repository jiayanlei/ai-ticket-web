import { envConfig } from '@/config';
import type { ApiId } from '@/api/types';
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
}

export async function loginApi(params: LoginParams): Promise<LoginResult> {
  if (envConfig.useMock) {
    await mockLatency();

    return normalizeLoginVO({
      userId: 1,
      username: params.username,
      nickname: '系统管理员',
      tokenName: 'Authorization',
      tokenValue: `mock-token-${params.username}-${Date.now()}`,
      tokenPrefix: 'Bearer',
      roles: ['admin'],
      permissions: ['*', '*:*:*'],
    });
  }

  const data = await http.post<LoginVO, LoginVO>('/auth/login', params);
  return normalizeLoginVO(data);
}

export async function logoutApi(): Promise<void> {
  if (envConfig.useMock) {
    await mockLatency(120);
    return;
  }

  await http.post<void, void>('/auth/logout');
}

export async function getUserInfoApi(): Promise<UserInfo> {
  if (envConfig.useMock) {
    await mockLatency();

    return normalizeLoginVO({
      userId: 1,
      username: 'admin',
      nickname: '系统管理员',
      tokenName: 'Authorization',
      tokenValue: '',
      tokenPrefix: 'Bearer',
      roles: ['admin'],
      permissions: ['*', '*:*:*'],
    });
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
  };
}

function mockLatency(delay = 240) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delay);
  });
}
