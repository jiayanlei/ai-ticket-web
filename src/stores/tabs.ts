import { defineStore } from 'pinia';

import { appSettings } from '@/config';
import { getStorageItem, removeStorageItem, setStorageItem } from '@/utils/storage';

export interface AppTab {
  path: string;
  title: string;
}

interface TabsCache {
  tabs: AppTab[];
  activePath: string;
}

function getInitialTabsCache(): TabsCache {
  if (!appSettings.cache.enableTabsCache) {
    return {
      tabs: [],
      activePath: '',
    };
  }

  const cache = getStorageItem<TabsCache>(appSettings.cache.tabsCacheKey, undefined, 'local') ?? {
    tabs: [],
    activePath: '',
  };
  const tabs = cache.tabs.filter((item) => !item.path.startsWith('/dashboard/screen'));

  return {
    tabs,
    activePath: cache.activePath.startsWith('/dashboard/screen') ? '' : cache.activePath,
  };
}

const initialTabsCache = getInitialTabsCache();

export const useTabsStore = defineStore('tabs', {
  state: () => ({
    tabs: initialTabsCache.tabs,
    activePath: initialTabsCache.activePath,
  }),
  actions: {
    addTab(tab: AppTab) {
      if (!this.tabs.some((item) => item.path === tab.path)) {
        this.tabs.push(tab);
      }
      this.activePath = tab.path;
      this.persist();
    },
    setActive(path: string) {
      this.activePath = path;
      this.persist();
    },
    removeTab(path: string) {
      const index = this.tabs.findIndex((item) => item.path === path);

      if (index < 0) {
        return this.activePath;
      }

      const nextTab =
        this.tabs[index + 1] ??
        this.tabs[index - 1] ?? {
          path: appSettings.app.defaultHomePath,
          title: '',
        };

      this.tabs = this.tabs.filter((item) => item.path !== path);

      if (this.activePath === path) {
        this.activePath = this.tabs.length ? nextTab.path : '';
      }

      this.persist();
      return this.activePath || appSettings.app.defaultHomePath;
    },
    closeOtherTabs(path: string) {
      const targetTab = this.tabs.find((item) => item.path === path);

      if (!targetTab) {
        return this.activePath || appSettings.app.defaultHomePath;
      }

      this.tabs = [targetTab];
      this.activePath = path;
      this.persist();
      return path;
    },
    closeLeftTabs(path: string) {
      const index = this.tabs.findIndex((item) => item.path === path);

      if (index <= 0) {
        return this.activePath || appSettings.app.defaultHomePath;
      }

      const removedTabs = this.tabs.slice(0, index);
      this.tabs = this.tabs.slice(index);

      if (removedTabs.some((item) => item.path === this.activePath)) {
        this.activePath = path;
      }

      this.persist();
      return this.activePath || appSettings.app.defaultHomePath;
    },
    closeRightTabs(path: string) {
      const index = this.tabs.findIndex((item) => item.path === path);

      if (index < 0 || index >= this.tabs.length - 1) {
        return this.activePath || appSettings.app.defaultHomePath;
      }

      const removedTabs = this.tabs.slice(index + 1);
      this.tabs = this.tabs.slice(0, index + 1);

      if (removedTabs.some((item) => item.path === this.activePath)) {
        this.activePath = path;
      }

      this.persist();
      return this.activePath || appSettings.app.defaultHomePath;
    },
    clearTabs() {
      this.tabs = [];
      this.activePath = '';
      removeStorageItem(appSettings.cache.tabsCacheKey, 'local');
    },
    persist() {
      if (!appSettings.cache.enableTabsCache) {
        return;
      }

      setStorageItem(
        appSettings.cache.tabsCacheKey,
        {
          tabs: this.tabs,
          activePath: this.activePath,
        },
        'local',
      );
    },
  },
});
