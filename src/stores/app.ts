import { defineStore } from 'pinia';

import { defaultLayoutSettings } from '@/config/layout';
import { appSettings } from '@/config/settings';
import type { LayoutMode, LayoutSettings, MenuMode, ThemeMode } from '@/types/layout';
import { getStorageItem, setStorageItem } from '@/utils/storage';

function readLayoutCache() {
  return getStorageItem<Partial<LayoutSettings>>(appSettings.cache.layoutCacheKey, {}, 'local') ?? {};
}

function readThemeCache() {
  return getStorageItem<ThemeMode>(appSettings.cache.themeCacheKey, appSettings.system.defaultTheme, 'local');
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.body.classList.toggle('app-theme-dark', theme === 'dark');
}

const initialTheme = readThemeCache() ?? appSettings.system.defaultTheme;
const initialLayout: LayoutSettings = {
  ...defaultLayoutSettings,
  ...readLayoutCache(),
  theme: initialTheme,
};

export const useAppStore = defineStore('app', {
  state: () => ({
    layout: initialLayout,
    keepAliveVersion: 0,
    initialized: false,
  }),
  getters: {
    layoutMode: (state): LayoutMode => state.layout.layoutMode,
    menuMode: (state): MenuMode => state.layout.menuMode,
    theme: (state): ThemeMode => state.layout.theme,
  },
  actions: {
    initialize() {
      if (this.initialized) {
        return;
      }

      this.initialized = true;
      applyTheme(this.layout.theme);
      this.persistLayout();
      this.$subscribe(
        (_mutation, state) => {
          applyTheme(state.layout.theme);
          setStorageItem(appSettings.cache.layoutCacheKey, state.layout, 'local');
          setStorageItem(appSettings.cache.themeCacheKey, state.layout.theme, 'local');
        },
        { detached: true },
      );
    },
    setLayoutMode(mode: LayoutMode) {
      this.layout.layoutMode = mode;
      this.layout.menuMode = mode;
      this.persistLayout();
    },
    setMenuMode(mode: MenuMode) {
      this.layout.menuMode = mode;
      this.persistLayout();
    },
    setTheme(theme: ThemeMode) {
      this.layout.theme = theme;
      applyTheme(theme);
      setStorageItem(appSettings.cache.themeCacheKey, theme, 'local');
      this.persistLayout();
    },
    updateLayout(settings: Partial<LayoutSettings>) {
      const nextTheme = settings.theme ?? this.layout.theme;
      this.layout = {
        ...this.layout,
        ...settings,
        theme: nextTheme,
      };
      applyTheme(nextTheme);
      setStorageItem(appSettings.cache.themeCacheKey, nextTheme, 'local');
      this.persistLayout();
    },
    toggleSidebar() {
      this.layout.sidebarCollapsed = !this.layout.sidebarCollapsed;
      this.persistLayout();
    },
    resetKeepAlive() {
      this.keepAliveVersion += 1;
    },
    persistLayout() {
      setStorageItem(appSettings.cache.layoutCacheKey, this.layout, 'local');
    },
  },
});
