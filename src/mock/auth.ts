import type { LoginParams, LoginResult, UserInfo } from '@/api/auth';
import { createMockResponse, rejectMockResponse } from '@/mock/core';
import { getMockMenus } from '@/mock/menu';
import { getMockPermissionsByRole, getMockUserProfile } from '@/mock/system';
import { getToken } from '@/utils/token';

function inferRoleCodes(username: string) {
  const normalized = username.toLowerCase();

  if (normalized.includes('admin')) {
    return ['admin'];
  }

  if (normalized.includes('knowledge') || normalized.includes('doc')) {
    return ['knowledge_admin'];
  }

  if (normalized.includes('ops') || normalized.includes('manager') || normalized.includes('lead')) {
    return ['ops_manager'];
  }

  return ['agent'];
}

function buildMockToken(username: string) {
  return `mock:${username}:${Date.now()}`;
}

function parseUsernameFromToken(token?: string) {
  if (!token?.startsWith('mock:')) {
    return 'admin';
  }

  return token.split(':')[1] || 'admin';
}

function buildLoginResult(username: string, token: string): LoginResult {
  const profile = getMockUserProfile(username);
  const roles = profile.roleCodes.length ? profile.roleCodes : inferRoleCodes(username);

  return {
    id: profile.id,
    userId: profile.id,
    username: profile.username,
    nickname: profile.nickname,
    tokenName: 'Authorization',
    tokenValue: token,
    tokenPrefix: 'Bearer',
    token,
    roles,
    permissions: getMockPermissionsByRole(roles),
    email: profile.email,
    mobile: profile.mobile,
    deptId: profile.deptId,
    deptName: profile.deptName,
    status: profile.status,
    jobNo: profile.jobNo,
    menus: getMockMenus(),
  };
}

export function mockLogin(params: LoginParams) {
  const username = params.username?.trim() || '';
  const password = params.password || '';

  if (username !== 'admin' || !['admin123', '123456'].includes(password)) {
    return rejectMockResponse('账号或密码错误，请确认后重试。', 401);
  }

  const token = buildMockToken(username);
  return createMockResponse(buildLoginResult(username, token));
}

export function mockLogout() {
  return createMockResponse(true);
}

export function mockGetUserInfo() {
  return createMockResponse<UserInfo>(buildLoginResult(parseUsernameFromToken(getToken()), getToken() || ''));
}
