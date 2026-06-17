import type { ApiId, CommonStatus, Nullable } from '@/api/types';
import { cleanPayload, cleanQuery } from '@/api/types';
import { envConfig } from '@/config';
import {
  createMockMenu,
  deleteMockMenu,
  getMockMenuDetail,
  getMockMenuList,
  updateMockMenu,
} from '@/mock/menu';
import { resolveMockResponse } from '@/mock/core';
import { http } from '@/utils/http';

export type MenuType = 'DIR' | 'MENU' | 'BUTTON';

export interface MenuQueryParams {
  menuName?: string;
  menuType?: MenuType;
  status?: CommonStatus;
}

export interface MenuItem {
  id: ApiId;
  parentId: ApiId;
  menuName: string;
  i18nKey?: Nullable<string>;
  menuType: MenuType;
  path: Nullable<string>;
  component: Nullable<string>;
  perms: Nullable<string>;
  icon: Nullable<string>;
  sortOrder: number;
  visible: boolean;
  status: CommonStatus;
  createTime: string;
  updateTime: string;
}

export interface MenuPayload {
  parentId?: ApiId;
  menuName: string;
  menuType: MenuType;
  path?: string;
  component?: string;
  perms?: string;
  icon?: string;
  sortOrder?: number;
  visible?: boolean;
  status?: CommonStatus;
}

export function getMenuListApi(params: MenuQueryParams = {}): Promise<MenuItem[]> {
  if (envConfig.useMock) {
    return resolveMockResponse(getMockMenuList(params));
  }

  return http.get<MenuItem[], MenuItem[]>('/system/menus', {
    params: cleanQuery(params),
  });
}

export function createMenuApi(data: MenuPayload): Promise<ApiId> {
  if (envConfig.useMock) {
    return resolveMockResponse(createMockMenu(data));
  }

  return http.post<ApiId, ApiId>('/system/menus', cleanPayload(data));
}

export function getMenuDetailApi(id: ApiId): Promise<MenuItem> {
  if (envConfig.useMock) {
    return resolveMockResponse(getMockMenuDetail(id));
  }

  return http.get<MenuItem, MenuItem>(`/system/menus/${id}`);
}

export function updateMenuApi(id: ApiId, data: MenuPayload): Promise<void> {
  if (envConfig.useMock) {
    return resolveMockResponse(updateMockMenu(id, data)).then(() => undefined);
  }

  return http.put<void, void>(`/system/menus/${id}`, cleanPayload(data));
}

export function deleteMenuApi(id: ApiId): Promise<void> {
  if (envConfig.useMock) {
    return resolveMockResponse(deleteMockMenu(id)).then(() => undefined);
  }

  return http.delete<void, void>(`/system/menus/${id}`);
}
