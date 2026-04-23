import { defineStore } from 'pinia';
import type { Router } from 'vue-router';

import { getMenuListApi } from '@/api/menu';
import type { MenuItem } from '@/api/menu';
import { appSettings } from '@/config';
import {
  buildBackendMenuTree,
  buildDynamicRoutes,
  collectPermissionCodes,
  toAppMenuItems,
} from '@/router/dynamic';
import type { BackendMenuNode } from '@/router/dynamic';
import type { AppMenuItem } from '@/types/menu';
import { getStorageItem, removeStorageItem, setStorageItem } from '@/utils/storage';

interface PermissionState {
  rawMenus: MenuItem[];
  menuTree: AppMenuItem[];
  permissions: string[];
  routesLoaded: boolean;
  registeredRouteNames: string[];
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
      this.rebuildFromMenus(router, buildBackendMenuTree(menus));
      return true;
    },
    rebuildCachedRoutes(router: Router) {
      if (this.routesLoaded || !this.rawMenus.length) {
        return false;
      }

      this.rebuildFromMenus(router, buildBackendMenuTree(this.rawMenus));
      return true;
    },
    rebuildFromMenus(router: Router, tree: BackendMenuNode[]) {
      this.menuTree = toAppMenuItems(tree);
      this.permissions = collectPermissionCodes(tree);

      const { routes, registeredNames } = buildDynamicRoutes(tree);
      registeredNames.forEach((name) => {
        if (router.hasRoute(name)) {
          router.removeRoute(name);
        }
      });
      routes.forEach((route) => {
        router.addRoute('Root', route);
      });

      this.registeredRouteNames = registeredNames;
      this.routesLoaded = true;
    },
    resetDynamicRoutes(router?: Router) {
      if (router) {
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
      removeStorageItem(appSettings.cache.menuCacheKey);
    },
  },
});
