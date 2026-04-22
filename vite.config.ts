import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { gzipSync } from 'node:zlib';

import vue from '@vitejs/plugin-vue';
import { defineConfig, loadEnv } from 'vite';
import type { Plugin } from 'vite';

interface ViteAppEnv {
  apiPrefix: string;
  port: number;
  host: string;
  open: boolean;
  useProxy: boolean;
  proxyTarget: string;
  proxyRewrite: string;
  dropConsole: boolean;
  dropDebugger: boolean;
  sourcemap: boolean;
  gzip: boolean;
  buildCompress: string;
  publicPath: string;
}

function readString(env: Record<string, string>, key: string, defaultValue = '') {
  const value = env[key];
  return value === undefined || value === '' ? defaultValue : value;
}

function readBoolean(env: Record<string, string>, key: string, defaultValue = false) {
  const value = readString(env, key);

  if (!value) {
    return defaultValue;
  }

  return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
}

function readNumber(env: Record<string, string>, key: string, defaultValue: number) {
  const value = Number(readString(env, key));
  return Number.isFinite(value) ? value : defaultValue;
}

function parseViteEnv(env: Record<string, string>): ViteAppEnv {
  return {
    apiPrefix: readString(env, 'VITE_APP_API_PREFIX', '/api'),
    port: readNumber(env, 'VITE_APP_PORT', 5173),
    host: readString(env, 'VITE_APP_HOST', '0.0.0.0'),
    open: readBoolean(env, 'VITE_APP_OPEN', false),
    useProxy: readBoolean(env, 'VITE_APP_USE_PROXY', false),
    proxyTarget: readString(env, 'VITE_APP_PROXY_TARGET'),
    proxyRewrite: readString(env, 'VITE_APP_PROXY_REWRITE'),
    dropConsole: readBoolean(env, 'VITE_APP_DROP_CONSOLE', false),
    dropDebugger: readBoolean(env, 'VITE_APP_DROP_DEBUGGER', false),
    sourcemap: readBoolean(env, 'VITE_APP_SOURCEMAP', false),
    gzip: readBoolean(env, 'VITE_APP_GZIP', false),
    buildCompress: readString(env, 'VITE_APP_BUILD_COMPRESS', 'none'),
    publicPath: readString(env, 'VITE_APP_PUBLIC_PATH', '/'),
  };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createProxyConfig(env: ViteAppEnv) {
  if (!env.useProxy || !env.proxyTarget) {
    return undefined;
  }

  const rewritePrefix = env.proxyRewrite || env.apiPrefix;

  return {
    [env.apiPrefix]: {
      target: env.proxyTarget,
      changeOrigin: true,
      rewrite: rewritePrefix
        ? (path: string) => path.replace(new RegExp(`^${escapeRegExp(rewritePrefix)}`), '')
        : undefined,
    },
  };
}

function gzipAssetsPlugin(enable: boolean): Plugin {
  const compressibleExtensions = new Set(['.css', '.html', '.js', '.json', '.svg', '.txt', '.xml']);
  let outDir = '';

  function compressFile(filePath: string) {
    if (!compressibleExtensions.has(extname(filePath)) || filePath.endsWith('.gz')) {
      return;
    }

    const source = readFileSync(filePath);
    writeFileSync(`${filePath}.gz`, gzipSync(source));
  }

  function walk(dir: string) {
    readdirSync(dir).forEach((name) => {
      const filePath = resolve(dir, name);
      const stat = statSync(filePath);

      if (stat.isDirectory()) {
        walk(filePath);
        return;
      }

      if (stat.isFile()) {
        compressFile(filePath);
      }
    });
  }

  return {
    name: 'app:gzip-assets',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      if (!enable || !outDir || !existsSync(outDir)) {
        return;
      }

      walk(outDir);
    },
  };
}

export default defineConfig(({ mode }) => {
  const appEnv = parseViteEnv(loadEnv(mode, process.cwd(), ''));
  const drop = [appEnv.dropConsole ? 'console' : undefined, appEnv.dropDebugger ? 'debugger' : undefined].filter(
    Boolean,
  ) as ('console' | 'debugger')[];

  return {
    base: appEnv.publicPath,
    plugins: [vue(), gzipAssetsPlugin(appEnv.gzip || appEnv.buildCompress === 'gzip')],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "@/styles/variables.scss" as *;',
        },
      },
    },
    server: {
      port: appEnv.port,
      host: appEnv.host,
      open: appEnv.open,
      proxy: createProxyConfig(appEnv),
    },
    esbuild: drop.length ? { drop } : undefined,
    build: {
      sourcemap: appEnv.sourcemap,
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          manualChunks: {
            vue: ['vue', 'vue-router', 'pinia'],
            antd: ['ant-design-vue', '@ant-design/icons-vue'],
            charts: ['echarts'],
          },
        },
      },
    },
  };
});
