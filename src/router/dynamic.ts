import type { RouteRecordRaw, Router } from 'vue-router';

import type { MenuItem, MenuType } from '@/api/menu';
import { appSettings } from '@/config';
import RouteView from '@/router/components/RouteView.vue';
import { CATCH_ALL_ROUTE_NAME, ROOT_ROUTE_NAME, catchAllRoute } from '@/router/routes';
import type { AppMenuItem } from '@/types/menu';
import { getStorageItem } from '@/utils/storage';

export interface BackendMenuNode extends MenuItem {
  children?: BackendMenuNode[];
}

interface DynamicRouteBuildResult {
  routes: RouteRecordRaw[];
  registeredNames: string[];
}

type ResolvedRouteComponent = NonNullable<RouteRecordRaw['component']>;

const viewModules = import.meta.glob('../views/**/*.vue');
const placeholderView: ResolvedRouteComponent = () => import('@/views/ai-ticket-os/index.vue');
const componentAliasMap: Record<string, string> = {
  'ai-ticket-os': 'ai-ticket-os/index',
  'system/user/index': 'system/users/index',
  'system/role/index': 'system/roles/index',
  'system/dept/index': 'system/depts/index',
  'system/menu/index': 'system/menus/index',
  'ticket/order/index': 'ticket/list/index',
  'knowledge/document/index': 'knowledge/documents/index',
  'knowledge/document': 'knowledge/documents/index',
  'knowledge/base': 'knowledge/base/index',
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
    .map((node) => toAppMenuItem(node))
    .filter((item): item is AppMenuItem => Boolean(item));
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
  const routes = nodes.flatMap((node) => toRouteRecords(node));

  return {
    routes,
    registeredNames: collectRouteNames(routes),
  };
}

export function registerCachedDynamicRoutes(router: Router) {
  const cachedMenus = getStorageItem<MenuItem[]>(appSettings.cache.menuCacheKey, [], 'local') ?? [];

  if (!cachedMenus.length) {
    return [];
  }

  const tree = buildBackendMenuTree(cachedMenus);
  const { routes, registeredNames } = buildDynamicRoutes(tree);

  removeCatchAllRoute(router);
  routes.forEach((route) => {
    if (!route.name || !router.hasRoute(String(route.name))) {
      router.addRoute(ROOT_ROUTE_NAME, route);
    }
  });

  return registeredNames;
}

export function registerCatchAllRoute(router: Router) {
  removeCatchAllRoute(router);
  router.addRoute(ROOT_ROUTE_NAME, catchAllRoute);
}

export function removeCatchAllRoute(router: Router) {
  if (router.hasRoute(CATCH_ALL_ROUTE_NAME)) {
    router.removeRoute(CATCH_ALL_ROUTE_NAME);
  }
}

function toAppMenuItem(node: BackendMenuNode): AppMenuItem | null {
  if (!node.visible || !isRenderableMenuType(node.menuType)) {
    return null;
  }

  const children = (node.children ?? [])
    .map((child) => toAppMenuItem(child))
    .filter((item): item is AppMenuItem => Boolean(item));
  const path = normalizeMenuPath(node.path);
  const targetPath = path ?? findFirstMenuTarget(children);

  if (!targetPath && !children.length) {
    return null;
  }

  return {
    key: createMenuKey(node),
    title: node.menuName,
    i18nKey: node.i18nKey ?? undefined,
    path,
    targetPath,
    icon: node.icon ?? undefined,
    permission: node.perms ?? undefined,
    children: children.length ? children : undefined,
  };
}

function toRouteRecords(node: BackendMenuNode, parentPath = '', parentTitle?: string): RouteRecordRaw[] {
  if (!isRouteMenuType(node.menuType)) {
    return [];
  }

  const currentPath = normalizeMenuPath(node.path);
  const childNodes = (node.children ?? []).filter((child) => isRouteMenuType(child.menuType));

  if (!currentPath) {
    return childNodes.flatMap((child) => toRouteRecords(child, parentPath, node.menuName));
  }

  const routeChildren = childNodes.flatMap((child) => toRouteRecords(child, currentPath, node.menuName));
  const meta = {
    title: node.menuName,
    i18nKey: node.i18nKey ?? undefined,
    parentTitle,
    permission: node.perms ?? undefined,
    keepAlive: node.menuType === 'MENU',
    dynamic: true,
  };

  if (routeChildren.length) {
    const route: RouteRecordRaw = {
      path: normalizeRoutePath(currentPath, parentPath),
      name: createRouteName(node),
      component: RouteView,
      meta: {
        ...meta,
        keepAlive: false,
      },
      children: routeChildren,
    };

    const selfComponent = node.component ? resolveViewComponent(node.component) : undefined;

    if (selfComponent) {
      route.children = [createIndexRoute(node, selfComponent, parentTitle), ...routeChildren];
    } else {
      const redirectPath = findFirstRoutePath(childNodes);
      if (redirectPath) {
        route.redirect = redirectPath;
      }
    }

    return [route];
  }

  return [
    {
      path: normalizeRoutePath(currentPath, parentPath),
      name: createRouteName(node),
      component: resolveViewComponent(node.component),
      meta,
    },
  ];
}

function createIndexRoute(
  node: BackendMenuNode,
  component: ResolvedRouteComponent,
  parentTitle?: string,
): RouteRecordRaw {
  return {
    path: '',
    name: `${createRouteName(node)}Index`,
    component,
    meta: {
      title: node.menuName,
      i18nKey: node.i18nKey ?? undefined,
      parentTitle,
      permission: node.perms ?? undefined,
      keepAlive: true,
      dynamic: true,
      hidden: true,
    },
  };
}

function resolveViewComponent(componentPath?: string | null): ResolvedRouteComponent {
  if (!componentPath) {
    return placeholderView;
  }

  const normalized = normalizeComponentPath(componentPath);
  const target = componentAliasMap[normalized] ?? normalized;
  const modulePath = `../views/${target}.vue`;

  return (viewModules[modulePath] as ResolvedRouteComponent | undefined) ?? placeholderView;
}

function normalizeComponentPath(componentPath: string) {
  return componentPath.replace(/^\/+/, '').replace(/\.vue$/, '');
}

function normalizeMenuPath(path?: string | null) {
  if (!path) {
    return undefined;
  }

  const trimmed = path.trim();

  if (!trimmed) {
    return undefined;
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
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
    const currentPath = normalizeMenuPath(node.path);

    if (currentPath) {
      return currentPath;
    }

    const childPath = findFirstRoutePath(node.children ?? []);
    if (childPath) {
      return childPath;
    }
  }

  return undefined;
}

function findFirstMenuTarget(nodes: AppMenuItem[]): string | undefined {
  for (const node of nodes) {
    if (node.targetPath) {
      return node.targetPath;
    }
  }

  return undefined;
}

function collectRouteNames(routes: RouteRecordRaw[]): string[] {
  const names: string[] = [];

  function walk(items: RouteRecordRaw[]) {
    items.forEach((item) => {
      if (item.name) {
        names.push(String(item.name));
      }
      if (item.children?.length) {
        walk(item.children);
      }
    });
  }

  walk(routes);
  return names;
}

function createMenuKey(node: MenuItem) {
  return normalizeMenuPath(node.path) || String(node.id);
}

function createRouteName(node: MenuItem) {
  const pathPart = (normalizeMenuPath(node.path) || String(node.id))
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
