export type LayoutMode = 'side' | 'top' | 'mixed';
export type MenuMode = 'side' | 'top' | 'mixed';
export type StorageType = 'local' | 'session';
export type PermissionMode = 'frontend' | 'backend';
export type ThemeMode = 'light' | 'dark';

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
    sidebarWidth: 280,
    sidebarCollapsedWidth: 62,
    contentPadding: 16,
    theme: 'dark' as ThemeMode,
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
    tabsCacheKey: 'TABS_CACHE',
    layoutCacheKey: 'LAYOUT_SETTINGS',
    themeCacheKey: 'THEME_MODE',
    menuCacheKey: 'DYNAMIC_MENUS',
    enableTabsCache: true,
  },
  system: {
    defaultTheme: 'dark' as ThemeMode,
    themeColor: '#4F7BFF',
    defaultLanguage: 'en-US',
    enableThemeSwitch: true,
    enableI18n: false,
    enableRouteGuard: true,
    enablePermission: true,
    enableErrorHandler: true,
    enableLog: true,
  },
});

export type AppSettings = typeof appSettings;
