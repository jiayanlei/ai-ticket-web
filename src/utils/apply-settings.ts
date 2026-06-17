import { appSettings } from '@/config';
import { getStorageItem, removeStorageItem, setStorageItem } from '@/utils/storage';

export function applyAppSettings() {
  migrateAppCache();

  const language =
    getStorageItem(appSettings.cache.languageCacheKey, appSettings.system.defaultLanguage, 'local') ??
    appSettings.system.defaultLanguage;
  document.documentElement.lang = language;
  document.body.classList.toggle('app-gray-mode', appSettings.app.enableGrayMode);
  document.body.classList.toggle('app-color-weakness', appSettings.app.enableColorWeakness);
}

function migrateAppCache() {
  const currentVersion = getStorageItem(appSettings.cache.versionCacheKey, '', 'local');

  if (currentVersion === appSettings.cache.cacheVersion) {
    return;
  }

  removeStorageItem(appSettings.cache.layoutCacheKey, 'local');
  removeStorageItem(appSettings.cache.themeCacheKey, 'local');
  removeStorageItem(appSettings.cache.menuCacheKey, 'local');
  removeStorageItem(appSettings.cache.tabsCacheKey, 'local');
  setStorageItem(appSettings.cache.languageCacheKey, appSettings.system.defaultLanguage, 'local');
  setStorageItem(appSettings.cache.versionCacheKey, appSettings.cache.cacheVersion, 'local');
}
