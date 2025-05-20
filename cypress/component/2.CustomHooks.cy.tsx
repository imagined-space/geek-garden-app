import React from 'react';
import { LanguageProvider, useLanguage } from '@/components/language/Context';

// 测试 useLanguage hook 的组件
const TestUseLanguageHook = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="test-hook">
      <div data-testid="current-language">{language}</div>
      <div data-testid="translation-home">{t('nav.home')}</div>
      <button data-testid="change-to-en" onClick={() => setLanguage('en')}>
        Change to English
      </button>
      <button data-testid="change-to-zh" onClick={() => setLanguage('zh')}>
        Change to Chinese
      </button>
    </div>
  );
};

describe('自定义 Hooks 测试', () => {
  it('useLanguage hook 应该工作正常', () => {
    // 挂载测试组件
    cy.mount(
      <LanguageProvider initialLanguage="en">
        <TestUseLanguageHook />
      </LanguageProvider>,
    );

    // 验证初始语言
    cy.get('[data-testid="current-language"]').should('contain', 'en');

    // 验证翻译功能
    cy.get('[data-testid="translation-home"]').should('not.be.empty');
    let englishText = '';
    cy.get('[data-testid="translation-home"]')
      .invoke('text')
      .then(text => {
        englishText = text;

        // 切换到中文
        cy.get('[data-testid="change-to-zh"]').click();

        // 验证语言已更新
        cy.get('[data-testid="current-language"]').should('contain', 'zh');

        // 验证翻译内容已更新
        cy.get('[data-testid="translation-home"]')
          .invoke('text')
          .should(chineseText => {
            expect(chineseText).not.to.equal(englishText);
          });

        // 切换回英文
        cy.get('[data-testid="change-to-en"]').click();

        // 验证英文恢复
        cy.get('[data-testid="current-language"]').should('contain', 'en');
        cy.get('[data-testid="translation-home"]').should('contain', englishText);
      });
  });
});
