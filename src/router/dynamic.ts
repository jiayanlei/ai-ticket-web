import type { RouteRecordRaw, Router } from 'vue-router';

import type { MenuItem, MenuType } from '@/api/menu';
import { appSettings } from '@/config';
import RouteView from '@/router/components/RouteView.vue';
import type { AppMenuItem } from '@/types/menu';
import { getStorageItem } from '@/utils/storage';

export interface BackendMenuNode extends MenuItem {
  children?: BackendMenuNode[];
}

interface DynamicRouteBuildResult {
  routes: RouteRecordRaw[];
  registeredNames: string[];
}

const viewModules = import.meta.glob('../views/**/*.vue');
const componentAliasMap: Record<string, string> = {
  'system/user/index': 'system/users/index',
  'system/role/index': 'system/roles/index',
  'system/dept/index': 'system/depts/index',
  'system/menu/index': 'system/menus/index',
  'ticket/order/index': 'ticket/list/index',
};

export function buildBackendMenuTree(list: MenuItem[]): BackendMenuNode[] {
  const nodeMap = new Map<string, BackendMenuNode>();
  const roots: BackendMenuNode[] = [];

  list
    .filter((item) => item.status === 'ENABLED')
    .forEach((item) => {
      nodeMap.set(String(item.id), { ...item });
    });

  nodeMap.forEach((node) => {
    const parent = nodeMap.get(String(node.parentId));

    if (parent && String(parent.id) !== String(node.id)) {
      parent.children = parent.children ?? [];
      parent.children.push(node);
      return;
    }

    roots.push(node);
  });

  sortMenuTree(roots);
  return roots;
}

export function toAppMenuItems(nodes: BackendMenuNode[]): AppMenuItem[] {
  return nodes
    .filter((node) => node.visible && isRenderableMenuType(node.menuType))
    .map((node) => ({
      key: createMenuKey(node),
      title: node.menuName,
      path: node.path ?? undefined,
      icon: node.icon ?? undefined,
      permission: node.perms ?? undefined,
      children: node.children ? toAppMenuItems(node.children) : undefined,
    }))
    .filter((item) => item.path || item.children?.length);
}

export function collectPermissionCodes(nodes: BackendMenuNode[]): string[] {
  const permissions = new Set<string>();

  function walk(items: BackendMenuNode[]) {
    items.forEach((item) => {
      if (item.perms) {
        permissions.add(item.perms);
      }
      if (item.children?.length) {
        walk(item.children);
      }
    });
  }

  walk(nodes);
  return [...permissions];
}

export function buildDynamicRoutes(nodes: BackendMenuNode[]): DynamicRouteBuildResult {
  const routes = nodes
    .filter((node) => isRouteMenuType(node.menuType))
    .map((node) => toRouteRecord(node))
    .filter((route): route is RouteRecordRaw => Boolean(route));

  return {
    routes,
    registeredNames: routes.map((route) => String(route.name)),
  };
}

export function registerCachedDynamicRoutes(router: Router) {
  const cachedMenus = getStorageItem<MenuItem[]>(appSettings.cache.menuCacheKey, [], 'local') ?? [];

  if (!cachedMenus.length) {
    return [];
  }

  const tree = buildBackendMenuTree(cachedMenus);
  const { routes, registeredNames } = buildDynamicRoutes(tree);

  routes.forEach((route) => {
    if (!router.hasRoute(String(route.name))) {
      router.addRoute('Root', route);
    }
  });

  return registeredNames;
}

function toRouteRecord(node: BackendMenuNode, parentPath = '', parentTitle?: string): RouteRecordRaw | null {
  if (!node.path || !isRouteMenuType(node.menuType)) {
    return null;
  }

  const routeChildren = (node.children ?? [])
    .filter((child) => isRouteMenuType(child.menuType))
    .map((child) => toRouteRecord(child, node.path ?? parentPath, node.menuName))
    .filter((route): route is RouteRecordRaw => Boolean(route));
  const hasChildren = routeChildren.length > 0;
  const component = hasChildren ? RouteView : resolveViewComponent(node.component);

  if (!component) {
    return null;
  }

  return {
    path: normalizeRoutePath(node.path, parentPath),
    name: createRouteName(node),
    component,
    redirect: hasChildren ? findFirstRoutePath(node.children ?? []) : undefined,
      meta: {
      title: node.menuName,
      parentTitle,
      permission: node.perms ?? undefined,
      keepAlive: node.menuType === 'MENU',
      dynamic: true,
    },
    children: routeChildren,
  };
}

function resolveViewComponent(componentPath: string | null): RouteRecordRaw['component'] | undefined {
  if (!componentPath) {
    return undefined;
  }

  const normalized = normalizeComponentPath(componentPath);
  const target = componentAliasMap[normalized] ?? normalized;
  const modulePath = `../views/${target}.vue`;

  return viewModules[modulePath] as RouteRecordRaw['component'] | undefined;
}

function normalizeComponentPath(componentPath: string) {
  return componentPath.replace(/^\/+/, '').replace(/\.vue$/, '');
}

function normalizeRoutePath(path: string, parentPath: string) {
  const normalized = path.replace(/^\/+/, '');

  if (!parentPath) {
    return normalized || '/';
  }

  const parent = parentPath.replace(/^\/+/, '').replace(/\/+$/, '');
  const prefix = `${parent}/`;

  if (normalized.startsWith(prefix)) {
    return normalized.slice(prefix.length) || '';
  }

  return normalized;
}

function findFirstRoutePath(nodes: BackendMenuNode[]): string | undefined {
  for (const node of nodes) {
    if (node.path && node.menuType === 'MENU') {
      return node.path;
    }

    const childPath = findFirstRoutePath(node.children ?? []);
    if (childPath) {
      return childPath;
    }
  }

  return undefined;
}

function createMenuKey(node: MenuItem) {
  return node.path || String(node.id);
}

function createRouteName(node: MenuItem) {
  const pathPart = (node.path || String(node.id))
    .replace(/^\//, '')
    .split('/')
    .filter(Boolean)
    .map((part) => part.replace(/(^|-)([a-z])/g, (_, __, char: string) => char.toUpperCase()))
    .join('');

  return pathPart ? `Dynamic${pathPart}` : `Dynamic${node.id}`;
}

function isRenderableMenuType(menuType: MenuType) {
  return menuType === 'DIR' || menuType === 'MENU';
}

function isRouteMenuType(menuType: MenuType) {
  return menuType === 'DIR' || menuType === 'MENU';
}

function sortMenuTree(nodes: BackendMenuNode[]) {
  nodes.sort((a, b) => {
    const orderDiff = (a.sortOrder ?? 0) - (b.sortOrder ?? 0);

    if (orderDiff !== 0) {
      return orderDiff;
    }

    return String(a.id).localeCompare(String(b.id));
  });
  nodes.forEach((node) => {
    if (node.children?.length) {
      sortMenuTree(node.children);
    }
  });
}
