import {
  AllTranslations,
  Language,
  LanguageContextType,
  LanguageProviderProps,
  TranslationDict,
} from './types';
import zhTranslations from './zh';
import enTranslations from './en';
import jaTranslations from './ja';
import koTranslations from './ko';

// 将所有翻译汇总在一起
export const translations: AllTranslations = {
  zh: zhTranslations,
  en: enTranslations,
  ja: jaTranslations,
  ko: koTranslations,
};

// 导出获取翻译的函数
export const getTranslation = (language: keyof AllTranslations, key: string): string => {
  if (!translations[language]) {
    return key;
  }

  return translations[language][key] || key;
};

export type {
  AllTranslations,
  Language,
  LanguageContextType,
  LanguageProviderProps,
  TranslationDict,
};
