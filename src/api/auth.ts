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
  await mockLatency();

  return {
    token: `mock-token-${params.username}-${Date.now()}`,
  };
}

export async function logoutApi(): Promise<void> {
  await mockLatency(120);
}

export async function getUserInfoApi(): Promise<UserInfo> {
  await mockLatency();

  return {
    id: 1,
    username: 'admin',
    nickname: '系统管理员',
    roles: ['admin'],
    permissions: ['*'],
  };
}

function mockLatency(delay = 240) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delay);
  });
}
