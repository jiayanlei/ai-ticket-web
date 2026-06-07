import { envConfig } from '@/config';
import {
  getMockCultureArticleList,
  getMockPermissionOverview,
  getMockSystemSettings,
  getMockTeamAssetList,
  updateMockSystemSettings,
  type CultureArticleItem,
  type SystemSettingItem,
  type TeamAssetItem,
} from '@/mock/system';
import { resolveMockResponse } from '@/mock/core';
import { http } from '@/utils/http';

export type { CultureArticleItem, SystemSettingItem, TeamAssetItem } from '@/mock/system';

export interface PermissionOverview {
  totalUsers: number;
  enabledUsers: number;
  totalRoles: number;
  enabledRoles: number;
  totalDepartments: number;
  totalPermissions: number;
  recentChanges: string[];
}

export function getSystemSettingsApi(): Promise<SystemSettingItem[]> {
  if (envConfig.useMock) {
    return resolveMockResponse(getMockSystemSettings());
  }

  return http.get<SystemSettingItem[], SystemSettingItem[]>('/system/settings');
}

export function updateSystemSettingsApi(
  items: Array<Pick<SystemSettingItem, 'key' | 'value'>>,
): Promise<SystemSettingItem[]> {
  if (envConfig.useMock) {
    return resolveMockResponse(updateMockSystemSettings(items), 220);
  }

  return http.put<SystemSettingItem[], SystemSettingItem[]>('/system/settings', items);
}

export function getPermissionOverviewApi(): Promise<PermissionOverview> {
  if (envConfig.useMock) {
    return resolveMockResponse(getMockPermissionOverview());
  }

  return http.get<PermissionOverview, PermissionOverview>('/system/permission/overview');
}

export function getTeamAssetListApi(): Promise<TeamAssetItem[]> {
  if (envConfig.useMock) {
    return resolveMockResponse(getMockTeamAssetList());
  }

  return http.get<TeamAssetItem[], TeamAssetItem[]>('/knowledge/assets/team');
}

export function getCultureArticleListApi(): Promise<CultureArticleItem[]> {
  if (envConfig.useMock) {
    return resolveMockResponse(getMockCultureArticleList());
  }

  return http.get<CultureArticleItem[], CultureArticleItem[]>('/culture/articles');
}
