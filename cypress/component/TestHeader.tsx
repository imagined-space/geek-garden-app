// cypress/components/TestHeader.tsx
import React, { useState } from 'react';
import { useLanguage } from '@components/language/Context';

const TestHeader = () => {
  const { language, setLanguage } = useLanguage();
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);

  const toggleLanguageMenu = () => setIsLanguageMenuOpen(!isLanguageMenuOpen);

  const changeLanguage = (newLang: 'en' | 'zh' | 'ja' | 'ko') => {
    setLanguage(newLang);
    setIsLanguageMenuOpen(false);
  };

  return (
    <header className="bg-darker-bg text-white">
      <nav className="container mx-auto py-4 flex justify-between items-center">
        <div className="flex items-center">
          <a href="/" className="text-neon-blue text-xl font-bold">
            {language === 'zh' ? 'Web3大学' : 'Web3 University'}
          </a>
          <div className="hidden md:flex ml-8">
            <a href="/" className="px-4 py-2">
              {language === 'zh' ? '首页' : 'Home'}
            </a>
            <a href="/knowledge" className="px-4 py-2">
              {language === 'zh' ? '知识库' : 'Knowledge'}
            </a>
            <a href="/market" className="px-4 py-2">
              {language === 'zh' ? '市场' : 'Market'}
            </a>
          </div>
        </div>
        <div className="flex items-center">
          {/* 语言切换器 */}
          <div className="relative">
            <button onClick={toggleLanguageMenu} data-testid="language-switcher">
              <span className="mr-1">{language === 'en' ? '🇬🇧' : '🇨🇳'}</span>
            </button>
            {isLanguageMenuOpen && (
              <ul className="absolute right-0 mt-2 w-24 bg-darker-bg border border-neon-blue rounded-lg shadow-lg z-50">
                <li
                  className="px-4 py-2 hover:bg-neon-blue/20 cursor-pointer"
                  onClick={() => changeLanguage('en')}
                  data-testid="language-option-en"
                >
                  🇬🇧 English
                </li>
                <li
                  className="px-4 py-2 hover:bg-neon-blue/20 cursor-pointer"
                  onClick={() => changeLanguage('zh')}
                  data-testid="language-option-zh"
                >
                  🇨🇳 中文
                </li>
              </ul>
            )}
          </div>
        </div>
      </nav>
      <h2 className="cyberpunk-title text-center">
        {language === 'zh' ? 'Web3教育平台' : 'Web3 Education Platform'}
      </h2>
    </header>
  );
};

export default TestHeader;
