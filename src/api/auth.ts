import { envConfig } from '@/config';
import { http } from '@/utils/http';

export interface LoginParams {
  username: string;
  password: string;
}

export interface LoginResult {
  token: string;
}

export interface UserInfo {
  id: number;
  username: string;
  nickname: string;
  roles: string[];
  permissions: string[];
}

export async function loginApi(params: LoginParams): Promise<LoginResult> {
  if (envConfig.useMock) {
    await mockLatency();

    return {
      token: `mock-token-${params.username}-${Date.now()}`,
    };
  }

  return http.post<LoginResult, LoginResult>('/auth/login', params);
}

export async function logoutApi(): Promise<void> {
  if (envConfig.useMock) {
    await mockLatency(120);
    return;
  }

  return http.post<void, void>('/auth/logout');
}

export async function getUserInfoApi(): Promise<UserInfo> {
  if (envConfig.useMock) {
    await mockLatency();

    return {
      id: 1,
      username: 'admin',
      nickname: '系统管理员',
      roles: ['admin'],
      permissions: ['*'],
    };
  }

  return http.get<UserInfo, UserInfo>('/auth/user-info');
}

function mockLatency(delay = 240) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delay);
  });
}
