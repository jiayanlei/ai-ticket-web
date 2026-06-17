export type LayoutMode = 'side' | 'top' | 'mixed';
export type MenuMode = 'side' | 'top' | 'mixed';
export type StorageType = 'local' | 'session';
export type PermissionMode = 'frontend' | 'backend';
export type ThemeMode = 'light' | 'dark';
export type LanguageMode = 'zh-CN' | 'en-US';

export const appSettings = Object.freeze({
  app: {
    showLogo: true,
    showTabs: true,
    showBreadcrumb: false,
    showFooter: false,
    showRefreshButton: true,
    showFullscreenButton: true,
    showSearch: true,
    enablePageTransition: true,
    enableWatermark: false,
    enableGrayMode: false,
    enableColorWeakness: false,
    defaultHomePath: '/dashboard/workbench',
    defaultLayoutStyle: 'side',
  },
  layout: {
    layoutMode: 'side' as LayoutMode,
    menuMode: 'side' as MenuMode,
    fixedHeader: true,
    sidebarCollapsed: false,
    sidebarWidth: 224,
    sidebarCollapsedWidth: 62,
    contentPadding: 16,
    theme: 'light' as ThemeMode,
  },
  auth: {
    tokenKey: 'ACCESS_TOKEN',
    refreshTokenKey: 'REFRESH_TOKEN',
    userInfoKey: 'USER_INFO',
    storageType: 'local' as StorageType,
    permissionMode: 'frontend' as PermissionMode,
    authWhiteList: ['/login', '/403', '/500'],
    loginRoutePath: '/login',
  },
  cache: {
    cachePrefix: 'AI_TICKET_',
    versionCacheKey: 'APP_CACHE_VERSION',
    cacheVersion: '2026-06-17-tenant-management',
    tabsCacheKey: 'TABS_CACHE',
    layoutCacheKey: 'LAYOUT_SETTINGS',
    themeCacheKey: 'THEME_MODE',
    languageCacheKey: 'LANGUAGE_MODE',
    menuCacheKey: 'DYNAMIC_MENUS',
    enableTabsCache: true,
  },
  system: {
    defaultTheme: 'light' as ThemeMode,
    themeColor: '#4F7BFF',
    defaultLanguage: 'zh-CN' as LanguageMode,
    enableThemeSwitch: true,
    enableI18n: true,
    enableRouteGuard: true,
    enablePermission: true,
    enableErrorHandler: true,
    enableLog: true,
  },
});

export type AppSettings = typeof appSettings;
