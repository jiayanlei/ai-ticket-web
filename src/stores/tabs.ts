import { defineStore } from 'pinia';

export interface AppTab {
  path: string;
  title: string;
}

export const useTabsStore = defineStore('tabs', {
  state: () => ({
    tabs: [] as AppTab[],
    activePath: '',
  }),
  actions: {
    addTab(tab: AppTab) {
      if (!this.tabs.some((item) => item.path === tab.path)) {
        this.tabs.push(tab);
      }
      this.activePath = tab.path;
    },
    removeTab(path: string) {
      this.tabs = this.tabs.filter((item) => item.path !== path);
      if (this.activePath === path) {
        this.activePath = this.tabs[this.tabs.length - 1]?.path ?? '';
      }
    },
    clearTabs() {
      this.tabs = [];
      this.activePath = '';
    },
  },
});
