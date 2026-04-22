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
    showSearch: false,
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
    sidebarWidth: 222,
    sidebarCollapsedWidth: 62,
    contentPadding: 10,
    theme: 'light' as ThemeMode,
  },
  auth: {
    tokenKey: 'ACCESS_TOKEN',
    refreshTokenKey: 'REFRESH_TOKEN',
    userInfoKey: 'USER_INFO',
    storageType: 'local' as StorageType,
    permissionMode: 'frontend' as PermissionMode,
    authWhiteList: ['/login', '/403', '/404', '/500'],
    loginRoutePath: '/login',
  },
  cache: {
    cachePrefix: 'AI_TICKET_',
    tabsCacheKey: 'TABS_CACHE',
    enableTabsCache: true,
  },
  system: {
    defaultTheme: 'light' as ThemeMode,
    themeColor: '#1677ff',
    defaultLanguage: 'zh-CN',
    enableThemeSwitch: true,
    enableI18n: false,
    enableRouteGuard: true,
    enablePermission: true,
    enableErrorHandler: true,
    enableLog: true,
  },
});

export type AppSettings = typeof appSettings;
