import type { LayoutSettings } from '@/types/layout';
import { appSettings } from '@/config/settings';

export const defaultLayoutSettings: LayoutSettings = {
  layoutMode: appSettings.layout.layoutMode,
  menuMode: appSettings.layout.menuMode,
  fixedHeader: appSettings.layout.fixedHeader,
  showLogo: appSettings.app.showLogo,
  showBreadcrumb: appSettings.app.showBreadcrumb,
  showTabs: appSettings.app.showTabs,
  sidebarCollapsed: appSettings.layout.sidebarCollapsed,
  sidebarWidth: appSettings.layout.sidebarWidth,
  sidebarCollapsedWidth: appSettings.layout.sidebarCollapsedWidth,
  contentPadding: appSettings.layout.contentPadding,
  theme: appSettings.layout.theme,
};
