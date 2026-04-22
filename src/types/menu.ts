import type { Component } from 'vue';

export interface AppMenuItem {
  key: string;
  title: string;
  path?: string;
  icon?: string | Component;
  children?: AppMenuItem[];
}
