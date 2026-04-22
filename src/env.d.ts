/// <reference types="vite/client" />

export {};

declare module '*.vue' {
  import type { DefineComponent } from 'vue';

  const component: DefineComponent<object, object, unknown>;
  export default component;
}

declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
    parentTitle?: string;
    public?: boolean;
    keepAlive?: boolean;
    roles?: string[];
  }
}
