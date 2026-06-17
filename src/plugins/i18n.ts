import { createI18n } from 'vue-i18n';

import { appSettings } from '@/config';
import { messages } from '@/locales';
import type { AppLocale } from '@/locales';
import { getStorageItem } from '@/utils/storage';

function getInitialLocale(): AppLocale {
  return (
    getStorageItem<AppLocale>(appSettings.cache.languageCacheKey, appSettings.system.defaultLanguage, 'local') ??
    appSettings.system.defaultLanguage
  );
}

export const i18n = createI18n({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: 'en-US',
  messages,
  missingWarn: false,
  fallbackWarn: false,
});

export function setI18nLocale(locale: AppLocale) {
  i18n.global.locale.value = locale;
  document.documentElement.lang = locale;
}
