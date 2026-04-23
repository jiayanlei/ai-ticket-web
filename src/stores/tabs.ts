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

  return (
    getStorageItem<TabsCache>(appSettings.cache.tabsCacheKey, undefined, 'local') ?? {
      tabs: [],
      activePath: '',
    }
  );
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
