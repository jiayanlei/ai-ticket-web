export type LayoutMode = 'side' | 'top' | 'mixed';

export interface LayoutSettings {
  mode: LayoutMode;
  fixedHeader: boolean;
  showBreadcrumb: boolean;
  showTabs: boolean;
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  sidebarCollapsedWidth: number;
  theme: 'light' | 'dark';
}
