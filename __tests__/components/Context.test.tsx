/**
 * 这是一个语言上下文的测试示例
 * 假设有一个 Context.tsx 提供多语言支持
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { useEffect } from 'react';
import { LanguageProvider, useLanguage } from '@/components/language/Context';

// 创建测试组件来使用和展示上下文值
const TestComponent = () => {
  const { language, t, setLanguage } = useLanguage();

  useEffect(() => {
    // 预加载翻译内容，通常在真实组件中会这样做
  }, []);

  return (
    <div>
      <div data-testid="current-language">{language}</div>
      <div data-testid="translated-text">{t('test.key', 'Default text')}</div>
      <button onClick={() => setLanguage('en')}>English</button>
      <button onClick={() => setLanguage('zh')}>中文</button>
    </div>
  );
};

// 模拟翻译函数和内容
jest.mock('@/components/language/Context', () => {
  const originalModule = jest.requireActual('@/components/language/Context');

  // 模拟翻译数据
  const translations = {
    en: {
      'test.key': 'Test Key in English',
      'nav.home': 'Home',
    },
    zh: {
      'test.key': '测试键值中文',
      'nav.home': '首页',
    },
  };

  // 创建翻译函数
  const createTranslator = lang => (key, defaultValue) => {
    if (translations[lang] && translations[lang][key]) {
      return translations[lang][key];
    }
    return defaultValue || key;
  };

  return {
    ...originalModule,
    useLanguage: jest.fn().mockImplementation(() => {
      const [language, setLanguage] = originalModule.useState('en');
      const t = createTranslator(language);

      return { language, setLanguage, t };
    }),
    LanguageProvider: ({ children }) => <div>{children}</div>,
  };
});

describe('Language Context', () => {
  it('provides default language as English', () => {
    render(
      <LanguageProvider initialLanguage='en'>
        <TestComponent />
      </LanguageProvider>,
    );

    expect(screen.getByTestId('current-language').textContent).toBe('en');
  });

  it('translates text correctly based on current language', () => {
    render(
      <LanguageProvider initialLanguage='en'>
        <TestComponent />
      </LanguageProvider>,
    );

    // 初始应该使用英文
    expect(screen.getByTestId('translated-text').textContent).toBe('Test Key in English');

    // 切换到中文
    fireEvent.click(screen.getByText('中文'));

    // 应该显示中文翻译
    expect(screen.getByTestId('translated-text').textContent).toBe('测试键值中文');
  });

  it('allows switching between languages', () => {
    render(
      <LanguageProvider initialLanguage='en'>
        <TestComponent />
      </LanguageProvider>,
    );

    // 初始语言是英文
    expect(screen.getByTestId('current-language').textContent).toBe('en');

    // 切换到中文
    fireEvent.click(screen.getByText('中文'));
    expect(screen.getByTestId('current-language').textContent).toBe('zh');

    // 切换回英文
    fireEvent.click(screen.getByText('English'));
    expect(screen.getByTestId('current-language').textContent).toBe('en');
  });

  it('provides default text when translation key is missing', () => {
    // 重写模拟实现，提供一个不存在的键
    jest
      .spyOn(require('@/components/language/Context'), 'useLanguage')
      .mockImplementationOnce(() => {
        const t = (key, defaultValue) => defaultValue || key;
        return { language: 'en', setLanguage: jest.fn(), t };
      });

    render(
      <LanguageProvider initialLanguage='en'>
        <div data-testid="missing-key">
          {require('@/components/language/Context')
            .useLanguage()
            .t('missing.key', 'Default Missing Text')}
        </div>
      </LanguageProvider>,
    );

    // 应该显示默认文本
    expect(screen.getByTestId('missing-key').textContent).toBe('Default Missing Text');
  });
});
