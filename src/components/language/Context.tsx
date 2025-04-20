'use client';

import React, { createContext, useState, useContext, useEffect, useMemo } from 'react';
import {
  getTranslation,
  Language,
  LanguageContextType,
  LanguageProviderProps,
} from '@/utils/languages';

// 创建语言环境上下文
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const formatterLanguage = (language: string): Language => {
  // 将语言字符串转换为小写
  const lang = language.toLowerCase().split('-')[0];

  // 检查语言是否在支持的列表中
  if (['zh', 'en', 'ja', 'ko'].includes(lang)) {
    return lang as Language;
  }

  // 默认返回英文
  return 'en';
}

export const LanguageProvider = ({ children, initialLanguage }: LanguageProviderProps) => {
  // 获取初始语言
  const getInitialLanguage = useMemo((): Language => {
    // 检查本地存储
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('preferred-language') as Language;
      if (savedLanguage && ['zh', 'en', 'ja', 'ko'].includes(savedLanguage)) {
        return savedLanguage;
      }
    }
    
    // 默认语言
    return 'en';
  }, []);

  // cookie > navigator.language > localStorage > 默认语言
  const [language, setLanguage] = useState<Language>(() => formatterLanguage(initialLanguage));

  // 初始化语言 - 在客户端挂载后执行
  useEffect(() => {
    if (!initialLanguage) {
      setLanguage(getInitialLanguage);
    }
  }, [initialLanguage, getInitialLanguage]);

  // 切换语言并保存到本地存储
  const handleSetLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage);
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferred-language', newLanguage);
      // 保存到 cookie
      document.cookie = `preferred-language=${newLanguage}; path=/; max-age=31536000;`;
    }
  };

  // 翻译函数
  const t = (key: string): string => getTranslation(language, key);

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// 自定义Hook，用于获取语言上下文
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
