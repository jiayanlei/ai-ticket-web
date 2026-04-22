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
    getStorageItem<TabsCache>(appSettings.cache.tabsCacheKey) ?? {
      tabs: [],
      activePath: '',
    }
  );
}

function persistTabsCache(cache: TabsCache) {
  if (!appSettings.cache.enableTabsCache) {
    return;
  }

  setStorageItem(appSettings.cache.tabsCacheKey, cache);
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
    removeTab(path: string) {
      this.tabs = this.tabs.filter((item) => item.path !== path);
      if (this.activePath === path) {
        this.activePath = this.tabs[this.tabs.length - 1]?.path ?? '';
      }
      this.persist();
    },
    clearTabs() {
      this.tabs = [];
      this.activePath = '';
      removeStorageItem(appSettings.cache.tabsCacheKey);
    },
    persist() {
      persistTabsCache({
        tabs: this.tabs,
        activePath: this.activePath,
      });
    },
  },
});
