import type { ApiId } from '@/api/types';
import { http } from '@/utils/http';

export interface SystemSettingItem {
  key: string;
  label: string;
  value: string | number | boolean;
  description: string;
  category: 'general' | 'security' | 'ai' | 'integration';
}

export interface TeamAssetItem {
  id: ApiId;
  name: string;
  type: 'template' | 'manual' | 'prompt' | 'script';
  owner: string;
  department: string;
  status: 'online' | 'draft' | 'archived';
  updateTime: string;
  usageCount: number;
}

export interface CultureArticleItem {
  id: ApiId;
  title: string;
  category: string;
  audience: string;
  owner: string;
  publishTime: string;
  summary: string;
}

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
  return http.get<SystemSettingItem[], SystemSettingItem[]>('/system/settings');
}

export function updateSystemSettingsApi(
  items: Array<Pick<SystemSettingItem, 'key' | 'value'>>,
): Promise<SystemSettingItem[]> {
  return http.put<SystemSettingItem[], SystemSettingItem[]>('/system/settings', items);
}

export function getPermissionOverviewApi(): Promise<PermissionOverview> {
  return http.get<PermissionOverview, PermissionOverview>('/system/permission/overview');
}

export function getTeamAssetListApi(): Promise<TeamAssetItem[]> {
  return http.get<TeamAssetItem[], TeamAssetItem[]>('/knowledge/assets/team');
}

export function getCultureArticleListApi(): Promise<CultureArticleItem[]> {
  return http.get<CultureArticleItem[], CultureArticleItem[]>('/culture/articles');
}
