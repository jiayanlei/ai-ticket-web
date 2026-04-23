/// <reference types="vite/client" />

export {};

declare global {
  interface ImportMetaEnv {
    readonly VITE_APP_ENV: string;
    readonly VITE_APP_TITLE: string;
    readonly VITE_APP_API_PREFIX: string;
    readonly VITE_APP_BASE_API: string;
    readonly VITE_APP_REQUEST_TIMEOUT: string;
    readonly VITE_APP_UPLOAD_URL: string;
    readonly VITE_APP_FILE_BASE_URL: string;
    readonly VITE_APP_PORT: string;
    readonly VITE_APP_HOST: string;
    readonly VITE_APP_OPEN: string;
    readonly VITE_APP_USE_PROXY: string;
    readonly VITE_APP_PROXY_TARGET: string;
    readonly VITE_APP_PROXY_REWRITE: string;
    readonly VITE_APP_DROP_CONSOLE: string;
    readonly VITE_APP_DROP_DEBUGGER: string;
    readonly VITE_APP_SOURCEMAP: string;
    readonly VITE_APP_GZIP: string;
    readonly VITE_APP_BUILD_COMPRESS: string;
    readonly VITE_APP_USE_MOCK: string;
    readonly VITE_APP_PUBLIC_PATH: string;
    readonly VITE_APP_ROUTER_HISTORY: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

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
    permission?: string;
    dynamic?: boolean;
    roles?: string[];
  }
}
