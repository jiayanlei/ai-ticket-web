import { defineStore } from 'pinia';

import { appSettings } from '@/config';
import { getStorageItem, setStorageItem } from '@/utils/storage';

export interface AppTab {
  path: string;
  title: string;
}

interface TabsCache {
  tabs: AppTab[];
  activePath: string;
}

const fixedHomeTab: AppTab = {
  path: appSettings.app.defaultHomePath,
  title: '仪表盘',
};

export function isFixedTabPath(path: string) {
  return path === fixedHomeTab.path;
}

function getInitialTabsCache(): TabsCache {
  if (!appSettings.cache.enableTabsCache) {
    return {
      tabs: [fixedHomeTab],
      activePath: fixedHomeTab.path,
    };
  }

  const cache = getStorageItem<TabsCache>(appSettings.cache.tabsCacheKey, undefined, 'local') ?? {
    tabs: [],
    activePath: '',
  };
  const tabs = ensureFixedHomeTab(cache.tabs.filter((item) => !item.path.startsWith('/dashboard/screen')));
  const activePath = cache.activePath.startsWith('/dashboard/screen') ? fixedHomeTab.path : cache.activePath;

  return {
    tabs,
    activePath: tabs.some((item) => item.path === activePath) ? activePath : fixedHomeTab.path,
  };
}

const initialTabsCache = getInitialTabsCache();

function ensureFixedHomeTab(tabs: AppTab[]) {
  const nextTabs = tabs.filter((item) => item.path !== fixedHomeTab.path);
  return [tabs.find((item) => item.path === fixedHomeTab.path) ?? fixedHomeTab, ...nextTabs];
}

export const useTabsStore = defineStore('tabs', {
  state: () => ({
    tabs: initialTabsCache.tabs,
    activePath: initialTabsCache.activePath,
  }),
  actions: {
    addTab(tab: AppTab) {
      if (!this.tabs.some((item) => item.path === tab.path)) {
        this.tabs.push(tab);
      } else if (isFixedTabPath(tab.path)) {
        this.tabs = this.tabs.map((item) => (item.path === tab.path ? tab : item));
      }
      this.tabs = ensureFixedHomeTab(this.tabs);
      this.activePath = tab.path;
      this.persist();
    },
    setActive(path: string) {
      this.activePath = path;
      this.persist();
    },
    removeTab(path: string) {
      if (isFixedTabPath(path)) {
        this.activePath = path;
        this.persist();
        return path;
      }

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

      this.tabs = ensureFixedHomeTab(this.tabs.filter((item) => item.path !== path));

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

      this.tabs = ensureFixedHomeTab(isFixedTabPath(path) ? [targetTab] : [fixedHomeTab, targetTab]);
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
      this.tabs = ensureFixedHomeTab(this.tabs.slice(index));

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
      this.tabs = ensureFixedHomeTab(this.tabs.slice(0, index + 1));

      if (removedTabs.some((item) => item.path === this.activePath)) {
        this.activePath = path;
      }

      this.persist();
      return this.activePath || appSettings.app.defaultHomePath;
    },
    clearTabs() {
      this.tabs = [fixedHomeTab];
      this.activePath = fixedHomeTab.path;
      this.persist();
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
