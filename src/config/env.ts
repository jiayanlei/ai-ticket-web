type AppEnv = 'development' | 'test' | 'production' | string;
type BuildCompress = 'gzip' | 'none' | string;
export type RouterHistoryMode = 'history' | 'hash';

function readEnv(key: string, defaultValue = '') {
  const value = import.meta.env[key];
  return value === undefined || value === null || value === '' ? defaultValue : String(value);
}

function readBoolean(key: string, defaultValue = false) {
  const value = readEnv(key);

  if (!value) {
    return defaultValue;
  }

  return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
}

function readNumber(key: string, defaultValue: number) {
  const value = Number(readEnv(key));
  return Number.isFinite(value) ? value : defaultValue;
}

function readRouterHistory(key: string, defaultValue: RouterHistoryMode): RouterHistoryMode {
  const value = readEnv(key, defaultValue);
  return value === 'hash' ? 'hash' : 'history';
}

export const envConfig = Object.freeze({
  appEnv: readEnv('VITE_APP_ENV', import.meta.env.MODE) as AppEnv,
  appTitle: readEnv('VITE_APP_TITLE', 'AI智能工单分析系统'),

  apiPrefix: readEnv('VITE_APP_API_PREFIX', '/api'),
  baseApi: readEnv('VITE_APP_BASE_API', ''),
  requestTimeout: readNumber('VITE_APP_REQUEST_TIMEOUT', 15_000),
  uploadUrl: readEnv('VITE_APP_UPLOAD_URL', '/file/upload'),
  fileBaseUrl: readEnv('VITE_APP_FILE_BASE_URL', ''),

  port: readNumber('VITE_APP_PORT', 5173),
  host: readEnv('VITE_APP_HOST', '0.0.0.0'),
  open: readBoolean('VITE_APP_OPEN', false),

  useProxy: readBoolean('VITE_APP_USE_PROXY', false),
  proxyTarget: readEnv('VITE_APP_PROXY_TARGET', ''),
  proxyRewrite: readEnv('VITE_APP_PROXY_REWRITE', ''),

  dropConsole: readBoolean('VITE_APP_DROP_CONSOLE', false),
  dropDebugger: readBoolean('VITE_APP_DROP_DEBUGGER', false),
  sourcemap: readBoolean('VITE_APP_SOURCEMAP', false),
  gzip: readBoolean('VITE_APP_GZIP', false),
  buildCompress: readEnv('VITE_APP_BUILD_COMPRESS', 'none') as BuildCompress,
  useMock: readBoolean('VITE_APP_USE_MOCK', false),

  publicPath: readEnv('VITE_APP_PUBLIC_PATH', '/'),
  routerHistory: readRouterHistory('VITE_APP_ROUTER_HISTORY', 'history'),
});

export type EnvConfig = typeof envConfig;
