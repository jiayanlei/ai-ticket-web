import { defineStore } from 'pinia';

import { defaultLayoutSettings } from '@/config/layout';
import type { LayoutMode, LayoutSettings, MenuMode } from '@/types/layout';

export const useAppStore = defineStore('app', {
  state: () => ({
    layout: { ...defaultLayoutSettings } as LayoutSettings,
  }),
  getters: {
    layoutMode: (state): LayoutMode => state.layout.layoutMode,
    menuMode: (state): MenuMode => state.layout.menuMode,
  },
  actions: {
    setLayoutMode(mode: LayoutMode) {
      this.layout.layoutMode = mode;
      this.layout.menuMode = mode;
    },
    setMenuMode(mode: MenuMode) {
      this.layout.menuMode = mode;
    },
    updateLayout(settings: Partial<LayoutSettings>) {
      this.layout = {
        ...this.layout,
        ...settings,
      };
    },
    toggleSidebar() {
      this.layout.sidebarCollapsed = !this.layout.sidebarCollapsed;
    },
  },
});
