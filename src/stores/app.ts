import { defineStore } from 'pinia';

import { defaultLayoutSettings } from '@/config/layout';
import { appSettings } from '@/config/settings';
import { setI18nLocale } from '@/plugins/i18n';
import type { AppLocale } from '@/locales';
import type { LanguageMode, LayoutMode, LayoutSettings, MenuMode, ThemeMode } from '@/types/layout';
import { getStorageItem, setStorageItem } from '@/utils/storage';

const LEGACY_SIDEBAR_WIDTH = 280;

function readLayoutCache() {
  const cache = getStorageItem<Partial<LayoutSettings>>(appSettings.cache.layoutCacheKey, {}, 'local') ?? {};

  if (cache.sidebarWidth === LEGACY_SIDEBAR_WIDTH) {
    return {
      ...cache,
      sidebarWidth: appSettings.layout.sidebarWidth,
    };
  }

  return cache;
}

function readThemeCache() {
  return getStorageItem<ThemeMode>(appSettings.cache.themeCacheKey, appSettings.system.defaultTheme, 'local');
}

function readLanguageCache() {
  return getStorageItem<LanguageMode>(appSettings.cache.languageCacheKey, appSettings.system.defaultLanguage, 'local');
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.body.classList.toggle('app-theme-dark', theme === 'dark');
}

const initialTheme = readThemeCache() ?? appSettings.system.defaultTheme;
const initialLanguage = readLanguageCache() ?? appSettings.system.defaultLanguage;
const initialLayout: LayoutSettings = {
  ...defaultLayoutSettings,
  ...readLayoutCache(),
  theme: initialTheme,
};
initialLayout.menuMode = initialLayout.layoutMode;

export const useAppStore = defineStore('app', {
  state: () => ({
    layout: initialLayout,
    language: initialLanguage,
    keepAliveVersion: 0,
    routeRefreshKeys: {} as Record<string, number>,
    initialized: false,
  }),
  getters: {
    layoutMode: (state): LayoutMode => state.layout.layoutMode,
    menuMode: (state): MenuMode => state.layout.menuMode,
    theme: (state): ThemeMode => state.layout.theme,
    locale: (state): LanguageMode => state.language,
  },
  actions: {
    initialize() {
      if (this.initialized) {
        return;
      }

      this.initialized = true;
      applyTheme(this.layout.theme);
      setI18nLocale(this.language as AppLocale);
      this.persistLayout();
      this.$subscribe(
        (_mutation, state) => {
          applyTheme(state.layout.theme);
          setI18nLocale(state.language as AppLocale);
          setStorageItem(appSettings.cache.layoutCacheKey, state.layout, 'local');
          setStorageItem(appSettings.cache.themeCacheKey, state.layout.theme, 'local');
          setStorageItem(appSettings.cache.languageCacheKey, state.language, 'local');
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
    setLanguage(language: LanguageMode) {
      this.language = language;
      setI18nLocale(language as AppLocale);
      setStorageItem(appSettings.cache.languageCacheKey, language, 'local');
    },
    toggleLanguage() {
      this.setLanguage(this.language === 'zh-CN' ? 'en-US' : 'zh-CN');
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
    refreshRoute(path: string) {
      this.routeRefreshKeys[path] = (this.routeRefreshKeys[path] ?? 0) + 1;
    },
    persistLayout() {
      setStorageItem(appSettings.cache.layoutCacheKey, this.layout, 'local');
    },
  },
});
