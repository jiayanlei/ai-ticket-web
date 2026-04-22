import { appSettings } from '@/config';

type LogMethod = 'debug' | 'info' | 'warn' | 'error';

function writeLog(method: LogMethod, args: unknown[]) {
  if (!appSettings.system.enableLog) {
    return;
  }

  console[method](...args);
}

export const logger = {
  debug: (...args: unknown[]) => writeLog('debug', args),
  info: (...args: unknown[]) => writeLog('info', args),
  warn: (...args: unknown[]) => writeLog('warn', args),
  error: (...args: unknown[]) => writeLog('error', args),
};
