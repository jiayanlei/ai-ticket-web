import { appSettings } from '@/config';

export function applyAppSettings() {
  document.documentElement.lang = appSettings.system.defaultLanguage;
  document.body.classList.toggle('app-gray-mode', appSettings.app.enableGrayMode);
  document.body.classList.toggle('app-color-weakness', appSettings.app.enableColorWeakness);
}
