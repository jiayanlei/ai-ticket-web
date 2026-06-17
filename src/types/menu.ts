import type { Component } from 'vue';

export interface AppMenuItem {
  key: string;
  title: string;
  i18nKey?: string;
  path?: string;
  targetPath?: string;
  icon?: string | Component;
  permission?: string;
  children?: AppMenuItem[];
}
