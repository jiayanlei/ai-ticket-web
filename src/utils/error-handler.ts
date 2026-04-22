import type { App } from 'vue';

import { appSettings } from '@/config';
import { logger } from '@/utils/logger';

export function setupErrorHandler(app: App) {
  if (!appSettings.system.enableErrorHandler) {
    return;
  }

  app.config.errorHandler = (error, instance, info) => {
    logger.error('[Vue Error]', { error, instance, info });
  };

  window.addEventListener('error', (event) => {
    logger.error('[Global Error]', event.error ?? event.message);
  });

  window.addEventListener('unhandledrejection', (event) => {
    logger.error('[Unhandled Rejection]', event.reason);
  });
}
