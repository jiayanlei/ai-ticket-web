import type { LanguageMode, LayoutMode, MenuMode, ThemeMode } from '@/config/settings';

export type { LanguageMode, LayoutMode, MenuMode, ThemeMode };

export interface LayoutSettings {
  layoutMode: LayoutMode;
  menuMode: MenuMode;
  fixedHeader: boolean;
  showLogo: boolean;
  showBreadcrumb: boolean;
  showTabs: boolean;
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  sidebarCollapsedWidth: number;
  contentPadding: number;
  theme: ThemeMode;
}
