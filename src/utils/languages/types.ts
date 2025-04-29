import { ReactNode } from "react";

// 支持的语言类型
export type Language = "zh" | "en" | "ja" | "ko";

// 语言环境上下文类型
export type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
};

// 语言提供者组件属性
export interface LanguageProviderProps {
  children: ReactNode;
  initialLanguage: string; // 使用可选参数
}

// 翻译对象类型
export interface TranslationDict {
  [key: string]: string;
}

// 全部翻译类型
export type AllTranslations = {
  [key in Language]: TranslationDict;
}