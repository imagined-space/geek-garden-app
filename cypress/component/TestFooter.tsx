import React from 'react';
import { useLanguage } from '@components/language/Context';

const TestFooter = () => {
  const { language } = useLanguage();

  return (
    <footer className="bg-darker-bg text-white py-8">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between">
          <div>
            <h3 className="text-lg font-bold mb-4">
              {language === 'zh' ? 'Web3大学' : 'Web3 University'}
            </h3>
            <p className="mb-4">
              {language === 'zh'
                ? '© 2023 Web3大学. 保留所有权利.'
                : '© 2023 Web3 University. All rights reserved.'}
            </p>
          </div>
          <div>
            <h4 className="text-lg font-bold mb-4">{language === 'zh' ? '链接' : 'Links'}</h4>
            <ul>
              <li>
                <a href="/" className="hover:text-neon-blue">
                  {language === 'zh' ? '首页' : 'Home'}
                </a>
              </li>
              <li>
                <a href="/about" className="hover:text-neon-blue">
                  {language === 'zh' ? '关于' : 'About'}
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:text-neon-blue">
                  {language === 'zh' ? '联系' : 'Contact'}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default TestFooter;
