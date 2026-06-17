import enUS from '@/locales/lang/en-US';
import zhCN from '@/locales/lang/zh-CN';

export const messages = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

export type AppLocale = keyof typeof messages;

export const localeOptions: { label: string; value: AppLocale }[] = [
  { label: '中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' },
];
