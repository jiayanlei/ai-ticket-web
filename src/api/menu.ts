import type { ApiId, CommonStatus, Nullable } from '@/api/types';
import { cleanPayload, cleanQuery } from '@/api/types';
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
  return http.get<MenuItem[], MenuItem[]>('/system/menus', {
    params: cleanQuery(params),
  });
}

export function createMenuApi(data: MenuPayload): Promise<ApiId> {
  return http.post<ApiId, ApiId>('/system/menus', cleanPayload(data));
}

export function getMenuDetailApi(id: ApiId): Promise<MenuItem> {
  return http.get<MenuItem, MenuItem>(`/system/menus/${id}`);
}

export function updateMenuApi(id: ApiId, data: MenuPayload): Promise<void> {
  return http.put<void, void>(`/system/menus/${id}`, cleanPayload(data));
}

export function deleteMenuApi(id: ApiId): Promise<void> {
  return http.delete<void, void>(`/system/menus/${id}`);
}
