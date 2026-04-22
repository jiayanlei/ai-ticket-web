import { defineStore } from 'pinia';

import { defaultLayoutSettings } from '@/config/layout';
import type { LayoutMode, LayoutSettings } from '@/types/layout';

export const useAppStore = defineStore('app', {
  state: () => ({
    layout: { ...defaultLayoutSettings } as LayoutSettings,
  }),
  getters: {
    layoutMode: (state): LayoutMode => state.layout.mode,
  },
  actions: {
    setLayoutMode(mode: LayoutMode) {
      this.layout.mode = mode;
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
