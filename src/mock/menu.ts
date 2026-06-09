import type { CommonStatus } from '@/api/types';
import type { MenuItem, MenuPayload, MenuQueryParams, MenuType } from '@/api/menu';
import { cloneMock, createMockId, createMockResponse, nowText } from '@/mock/core';

const menuTime = '2026-06-07 09:00:00';

function createMenuItem(input: {
  id: string;
  parentId: string | number;
  menuName: string;
  menuType: MenuType;
  path?: string;
  component?: string;
  perms?: string;
  icon?: string;
  sortOrder: number;
  visible?: boolean;
  status?: CommonStatus;
}): MenuItem {
  return {
    id: input.id,
    parentId: input.parentId,
    menuName: input.menuName,
    menuType: input.menuType,
    path: input.path ?? null,
    component: input.component ?? null,
    perms: input.perms ?? null,
    icon: input.icon ?? null,
    sortOrder: input.sortOrder,
    visible: input.visible ?? true,
    status: input.status ?? 'ENABLED',
    createTime: menuTime,
    updateTime: menuTime,
  };
}

const menuSeeds: MenuItem[] = [
  createMenuItem({
    id: 'm-dashboard',
    parentId: 0,
    menuName: '首页工作台',
    menuType: 'DIR',
    sortOrder: 1,
    icon: 'dashboard',
  }),
  createMenuItem({
    id: 'm-dashboard-workbench',
    parentId: 'm-dashboard',
    menuName: '工作台',
    menuType: 'MENU',
    path: '/dashboard/workbench',
    component: 'dashboard/workbench/index',
    perms: 'dashboard:workbench:view',
    icon: 'home',
    sortOrder: 1,
  }),
  createMenuItem({
    id: 'm-dashboard-todo',
    parentId: 'm-dashboard',
    menuName: '我的待办',
    menuType: 'MENU',
    path: '/dashboard/todo',
    component: 'dashboard/todo/index',
    perms: 'dashboard:todo:view',
    icon: 'schedule',
    sortOrder: 2,
  }),

  createMenuItem({
    id: 'm-analytics',
    parentId: 0,
    menuName: '运营大屏',
    menuType: 'DIR',
    sortOrder: 2,
    icon: 'area-chart',
  }),
  createMenuItem({
    id: 'm-analytics-report',
    parentId: 'm-analytics',
    menuName: '数据报表',
    menuType: 'MENU',
    path: '/analytics/cockpit',
    component: 'analytics/cockpit/index',
    perms: 'analytics:cockpit:view',
    icon: 'bar-chart',
    sortOrder: 1,
  }),

  createMenuItem({
    id: 'm-ticket',
    parentId: 0,
    menuName: '工单管理',
    menuType: 'DIR',
    sortOrder: 3,
    icon: 'ticket',
  }),
  createMenuItem({
    id: 'm-ticket-list',
    parentId: 'm-ticket',
    menuName: '工单列表',
    menuType: 'MENU',
    path: '/ticket/list',
    component: 'ticket/list/index',
    perms: 'ticket:order:list',
    icon: 'unordered-list',
    sortOrder: 1,
  }),
  createMenuItem({
    id: 'm-ticket-create',
    parentId: 'm-ticket',
    menuName: '新建工单',
    menuType: 'MENU',
    path: '/ticket/create',
    component: 'ticket/create/index',
    perms: 'ticket:order:create',
    icon: 'plus-circle',
    sortOrder: 2,
  }),
  createMenuItem({
    id: 'm-ticket-trash',
    parentId: 'm-ticket',
    menuName: '工单回收站',
    menuType: 'MENU',
    path: '/ticket/trash',
    component: 'ticket/trash/index',
    perms: 'ticket:order:trash',
    icon: 'delete',
    sortOrder: 3,
  }),

  createMenuItem({
    id: 'm-knowledge',
    parentId: 0,
    menuName: '知识中心',
    menuType: 'DIR',
    sortOrder: 4,
    icon: 'book',
  }),
  createMenuItem({
    id: 'm-knowledge-base',
    parentId: 'm-knowledge',
    menuName: '知识库',
    menuType: 'MENU',
    path: '/knowledge',
    component: 'knowledge/base/index',
    perms: 'knowledge:base:view',
    icon: 'read',
    sortOrder: 1,
  }),
  createMenuItem({
    id: 'm-knowledge-manage',
    parentId: 'm-knowledge',
    menuName: '知识库管理',
    menuType: 'MENU',
    path: '/knowledge/manage',
    component: 'knowledge/manage/index',
    perms: 'knowledge:document:list',
    icon: 'book',
    sortOrder: 2,
  }),
  createMenuItem({
    id: 'm-knowledge-team-assets',
    parentId: 'm-knowledge',
    menuName: '文档中心',
    menuType: 'MENU',
    path: '/knowledge/team-assets',
    component: 'assets/team/index',
    perms: 'knowledge:asset:list',
    icon: 'team',
    sortOrder: 3,
  }),

  createMenuItem({
    id: 'm-ai',
    parentId: 0,
    menuName: 'AI 应用',
    menuType: 'DIR',
    sortOrder: 5,
    icon: 'robot',
  }),
  createMenuItem({
    id: 'm-ai-chat',
    parentId: 'm-ai',
    menuName: 'AI 问答',
    menuType: 'MENU',
    path: '/ai/chat',
    component: 'console/codex/index',
    perms: 'ai:assistant:chat',
    icon: 'robot',
    sortOrder: 1,
  }),
  createMenuItem({
    id: 'm-ai-overview',
    parentId: 'm-ai',
    menuName: 'AI 分析概览',
    menuType: 'MENU',
    path: '/ai/overview',
    component: 'ai/overview/index',
    perms: 'ai:overview:view',
    icon: 'bar-chart',
    sortOrder: 2,
  }),
  createMenuItem({
    id: 'm-ai-conversation',
    parentId: 'm-ai',
    menuName: '对话记录',
    menuType: 'MENU',
    path: '/ai/conversation',
    component: 'conversation/records/index',
    perms: 'ai:conversation:list',
    icon: 'profile',
    sortOrder: 3,
  }),

  createMenuItem({
    id: 'm-system',
    parentId: 0,
    menuName: '系统设置',
    menuType: 'DIR',
    sortOrder: 6,
    icon: 'setting',
  }),
  createMenuItem({
    id: 'm-system-settings',
    parentId: 'm-system',
    menuName: '系统配置',
    menuType: 'MENU',
    path: '/system/settings',
    component: 'system/settings/index',
    perms: 'system:settings:view',
    icon: 'setting',
    sortOrder: 1,
  }),
  createMenuItem({
    id: 'm-system-users',
    parentId: 'm-system',
    menuName: '用户管理',
    menuType: 'MENU',
    path: '/system/users',
    component: 'system/users/index',
    perms: 'system:user:list',
    icon: 'user',
    sortOrder: 2,
  }),
  createMenuItem({
    id: 'm-system-roles',
    parentId: 'm-system',
    menuName: '角色管理',
    menuType: 'MENU',
    path: '/system/roles',
    component: 'system/roles/index',
    perms: 'system:role:list',
    icon: 'team',
    sortOrder: 3,
  }),
  createMenuItem({
    id: 'm-system-depts',
    parentId: 'm-system',
    menuName: '部门管理',
    menuType: 'MENU',
    path: '/system/depts',
    component: 'system/depts/index',
    perms: 'system:dept:list',
    icon: 'apartment',
    sortOrder: 4,
  }),
  createMenuItem({
    id: 'm-system-menus',
    parentId: 'm-system',
    menuName: '菜单管理',
    menuType: 'MENU',
    path: '/system/menus',
    component: 'system/menus/index',
    perms: 'system:menu:list',
    icon: 'menu',
    sortOrder: 5,
  }),
  createMenuItem({
    id: 'm-system-permission',
    parentId: 'm-system',
    menuName: '用户权限',
    menuType: 'MENU',
    path: '/system/permission',
    component: 'system/permission/index',
    perms: 'system:permission:view',
    icon: 'shield',
    sortOrder: 6,
  }),

  createMenuItem({
    id: 'btn-ticket-create',
    parentId: 'm-ticket-list',
    menuName: '工单新增',
    menuType: 'BUTTON',
    perms: 'ticket:order:create',
    sortOrder: 1,
  }),
  createMenuItem({
    id: 'btn-ticket-update',
    parentId: 'm-ticket-list',
    menuName: '工单编辑',
    menuType: 'BUTTON',
    perms: 'ticket:order:update',
    sortOrder: 2,
  }),
  createMenuItem({
    id: 'btn-ticket-delete',
    parentId: 'm-ticket-list',
    menuName: '工单删除',
    menuType: 'BUTTON',
    perms: 'ticket:order:delete',
    sortOrder: 3,
  }),
  createMenuItem({
    id: 'btn-ticket-detail',
    parentId: 'm-ticket-list',
    menuName: '查看详情',
    menuType: 'BUTTON',
    perms: 'ticket:order:detail',
    sortOrder: 4,
  }),
  createMenuItem({
    id: 'btn-ticket-export',
    parentId: 'm-ticket-list',
    menuName: '工单导出',
    menuType: 'BUTTON',
    perms: 'ticket:order:export',
    sortOrder: 5,
  }),
  createMenuItem({
    id: 'btn-knowledge-create',
    parentId: 'm-knowledge-manage',
    menuName: '知识新增',
    menuType: 'BUTTON',
    perms: 'knowledge:document:create',
    sortOrder: 1,
  }),
  createMenuItem({
    id: 'btn-knowledge-update',
    parentId: 'm-knowledge-manage',
    menuName: '知识编辑',
    menuType: 'BUTTON',
    perms: 'knowledge:document:update',
    sortOrder: 2,
  }),
  createMenuItem({
    id: 'btn-knowledge-delete',
    parentId: 'm-knowledge-manage',
    menuName: '知识删除',
    menuType: 'BUTTON',
    perms: 'knowledge:document:delete',
    sortOrder: 3,
  }),
  createMenuItem({
    id: 'btn-knowledge-publish',
    parentId: 'm-knowledge-manage',
    menuName: '知识发布',
    menuType: 'BUTTON',
    perms: 'knowledge:document:publish',
    sortOrder: 4,
  }),
  createMenuItem({
    id: 'btn-knowledge-offline',
    parentId: 'm-knowledge-manage',
    menuName: '知识下架',
    menuType: 'BUTTON',
    perms: 'knowledge:document:offline',
    sortOrder: 5,
  }),
  createMenuItem({
    id: 'btn-knowledge-import',
    parentId: 'm-knowledge-document',
    menuName: '文档导入',
    menuType: 'BUTTON',
    perms: 'knowledge:document:import',
    sortOrder: 1,
  }),
  createMenuItem({
    id: 'btn-knowledge-export',
    parentId: 'm-knowledge-document',
    menuName: '文档导出',
    menuType: 'BUTTON',
    perms: 'knowledge:document:export',
    sortOrder: 2,
  }),
  createMenuItem({
    id: 'btn-user-create',
    parentId: 'm-system-users',
    menuName: '用户新增',
    menuType: 'BUTTON',
    perms: 'system:user:create',
    sortOrder: 1,
  }),
  createMenuItem({
    id: 'btn-user-update',
    parentId: 'm-system-users',
    menuName: '用户编辑',
    menuType: 'BUTTON',
    perms: 'system:user:update',
    sortOrder: 2,
  }),
  createMenuItem({
    id: 'btn-user-delete',
    parentId: 'm-system-users',
    menuName: '用户删除',
    menuType: 'BUTTON',
    perms: 'system:user:delete',
    sortOrder: 3,
  }),
  createMenuItem({
    id: 'btn-role-assign',
    parentId: 'm-system-roles',
    menuName: '角色授权',
    menuType: 'BUTTON',
    perms: 'system:role:assign',
    sortOrder: 1,
  }),
  createMenuItem({
    id: 'btn-role-update',
    parentId: 'm-system-roles',
    menuName: '角色编辑',
    menuType: 'BUTTON',
    perms: 'system:role:update',
    sortOrder: 2,
  }),
  createMenuItem({
    id: 'btn-menu-update',
    parentId: 'm-system-menus',
    menuName: '菜单编辑',
    menuType: 'BUTTON',
    perms: 'system:menu:update',
    sortOrder: 1,
  }),
  createMenuItem({
    id: 'btn-settings-update',
    parentId: 'm-system-settings',
    menuName: '系统设置保存',
    menuType: 'BUTTON',
    perms: 'system:settings:update',
    sortOrder: 1,
  }),
];

let mockMenus = cloneMock(menuSeeds);

export function getMockMenuList(params: MenuQueryParams = {}) {
  const menuName = params.menuName?.trim().toLowerCase();
  const filtered = mockMenus.filter((item) => {
    const matchName = !menuName || item.menuName.toLowerCase().includes(menuName);
    const matchType = !params.menuType || item.menuType === params.menuType;
    const matchStatus = !params.status || item.status === params.status;
    return matchName && matchType && matchStatus;
  });

  return createMockResponse(filtered);
}

export function getMockMenuDetail(id: string | number) {
  return createMockResponse(findMenu(id));
}

export function createMockMenu(data: MenuPayload) {
  const id = createMockId('menu');
  const timestamp = nowText();
  mockMenus.unshift(
    createMenuItem({
      id,
      parentId: data.parentId ?? 0,
      menuName: data.menuName,
      menuType: data.menuType,
      path: data.path,
      component: data.component,
      perms: data.perms,
      icon: data.icon,
      sortOrder: data.sortOrder ?? 0,
      visible: data.visible ?? true,
      status: data.status ?? 'ENABLED',
    }),
  );
  mockMenus = mockMenus.map((item) => (item.id === id ? { ...item, createTime: timestamp, updateTime: timestamp } : item));
  return createMockResponse(id);
}

export function updateMockMenu(id: string | number, data: MenuPayload) {
  findMenu(id);
  mockMenus = mockMenus.map((item) =>
    String(item.id) === String(id)
      ? {
          ...item,
          parentId: data.parentId ?? item.parentId,
          menuName: data.menuName,
          menuType: data.menuType,
          path: data.path ?? null,
          component: data.component ?? null,
          perms: data.perms ?? null,
          icon: data.icon ?? null,
          sortOrder: data.sortOrder ?? item.sortOrder,
          visible: data.visible ?? item.visible,
          status: data.status ?? item.status,
          updateTime: nowText(),
        }
      : item,
  );
  return createMockResponse(true);
}

export function deleteMockMenu(id: string | number) {
  const blockedIds = new Set([String(id)]);
  let changed = true;

  while (changed) {
    changed = false;
    mockMenus.forEach((item) => {
      if (!blockedIds.has(String(item.id)) && blockedIds.has(String(item.parentId))) {
        blockedIds.add(String(item.id));
        changed = true;
      }
    });
  }

  mockMenus = mockMenus.filter((item) => !blockedIds.has(String(item.id)));
  return createMockResponse(true);
}

export function getMockMenus() {
  return cloneMock(mockMenus);
}

export function getMockPermissionCodes() {
  return cloneMock(
    mockMenus
      .filter((item) => item.menuType === 'BUTTON' && item.perms)
      .map((item) => item.perms as string),
  );
}

function findMenu(id: string | number) {
  const record = mockMenus.find((item) => String(item.id) === String(id));

  if (!record) {
    throw new Error(`Menu ${id} not found`);
  }

  return cloneMock(record);
}
