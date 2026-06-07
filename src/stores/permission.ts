import { defineStore } from 'pinia';
import type { Router } from 'vue-router';

import { getMenuListApi } from '@/api/menu';
import type { MenuItem } from '@/api/menu';
import { appSettings } from '@/config';
import {
  buildBackendMenuTree,
  buildDynamicRoutes,
  collectPermissionCodes,
  registerCatchAllRoute,
  removeCatchAllRoute,
  toAppMenuItems,
} from '@/router/dynamic';
import { ROOT_ROUTE_NAME } from '@/router/routes';
import type { BackendMenuNode } from '@/router/dynamic';
import type { AppMenuItem } from '@/types/menu';
import { getStorageItem, removeStorageItem, setStorageItem } from '@/utils/storage';

interface PermissionState {
  rawMenus: MenuItem[];
  menuTree: AppMenuItem[];
  permissions: string[];
  routesLoaded: boolean;
  registeredRouteNames: string[];
  activeRootMenuKey: string;
}

function readCachedMenus() {
  return getStorageItem<MenuItem[]>(appSettings.cache.menuCacheKey, [], 'local') ?? [];
}

export const usePermissionStore = defineStore('permission', {
  state: (): PermissionState => ({
    rawMenus: readCachedMenus(),
    menuTree: [],
    permissions: [],
    routesLoaded: false,
    registeredRouteNames: [],
    activeRootMenuKey: '',
  }),
  getters: {
    menus: (state): AppMenuItem[] => state.menuTree,
    hasMenus: (state) => state.menuTree.length > 0,
  },
  actions: {
    async ensureDynamicRoutes(router: Router) {
      if (this.routesLoaded) {
        return false;
      }

      const menus = await getMenuListApi({ status: 'ENABLED' });
      this.rawMenus = menus;
      setStorageItem(appSettings.cache.menuCacheKey, menus, 'local');
      this.rebuildFromMenus(router, buildBackendMenuTree(menus), true);
      return true;
    },
    rebuildCachedRoutes(router: Router) {
      if (this.routesLoaded || !this.rawMenus.length) {
        return false;
      }

      this.rebuildFromMenus(router, buildBackendMenuTree(this.rawMenus), false);
      return true;
    },
    rebuildFromMenus(router: Router, tree: BackendMenuNode[], markRoutesLoaded = true) {
      this.menuTree = toAppMenuItems(tree);
      this.permissions = collectPermissionCodes(tree);
      if (this.activeRootMenuKey && !this.menuTree.some((item) => item.key === this.activeRootMenuKey)) {
        this.activeRootMenuKey = '';
      }
      if (!this.activeRootMenuKey && this.menuTree.length) {
        this.activeRootMenuKey = this.menuTree[0].key;
      }

      const { routes, registeredNames } = buildDynamicRoutes(tree);
      removeCatchAllRoute(router);
      const dynamicRouteNames = new Set([...this.registeredRouteNames, ...registeredNames]);
      router.getRoutes().forEach((route) => {
        if (route.name && route.meta.dynamic) {
          dynamicRouteNames.add(String(route.name));
        }
      });
      dynamicRouteNames.forEach((name) => {
        if (router.hasRoute(name)) {
          router.removeRoute(name);
        }
      });
      routes.forEach((route) => {
        router.addRoute(ROOT_ROUTE_NAME, route);
      });

      this.registeredRouteNames = registeredNames;
      this.routesLoaded = markRoutesLoaded;

      if (markRoutesLoaded) {
        registerCatchAllRoute(router);
      }
    },
    resetDynamicRoutes(router?: Router) {
      if (router) {
        removeCatchAllRoute(router);
        this.registeredRouteNames.forEach((name) => {
          if (router.hasRoute(name)) {
            router.removeRoute(name);
          }
        });
      }

      this.rawMenus = [];
      this.menuTree = [];
      this.permissions = [];
      this.routesLoaded = false;
      this.registeredRouteNames = [];
      this.activeRootMenuKey = '';
      removeStorageItem(appSettings.cache.menuCacheKey);
    },
    setActiveRootMenuKey(key: string) {
      this.activeRootMenuKey = key;
    },
  },
});
