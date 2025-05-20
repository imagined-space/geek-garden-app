import React from 'react';
import { mount } from 'cypress/react18';
import LanguageSwitcher from '../../components/language/Switcher';
import { LanguageProvider } from '../../components/language/Context';

describe('LanguageSwitcher 组件', () => {
  beforeEach(() => {
    // 设置 localStorage mock
    cy.window().then(win => {
      win.localStorage.clear();
    });

    // 挂载组件
    cy.mount(
      <LanguageProvider initialLanguage="en">
        <LanguageSwitcher />
      </LanguageProvider>,
    );
  });

  it('应该显示当前语言', () => {
    // 检查默认语言英语
    cy.get('button').first().should('contain', '🇬🇧');
  });

  it('应该打开下拉菜单并允许选择语言', () => {
    // 检查下拉菜单初始应该是关闭的
    cy.get('div[role="menu"]').should('not.exist');

    // 点击切换下拉菜单
    cy.get('button').first().click();

    // 下拉菜单应该打开
    cy.get('div[role="menu"]').should('be.visible');

    // 应该显示多种语言选项
    cy.get('div[role="menu"] button').should('have.length', 4);
    cy.get('div[role="menu"] button').should('contain', '🇨🇳');
    cy.get('div[role="menu"] button').should('contain', '🇬🇧');
    cy.get('div[role="menu"] button').should('contain', '🇯🇵');
    cy.get('div[role="menu"] button').should('contain', '🇰🇷');

    // 选择中文
    cy.get('div[role="menu"] button').contains('🇨🇳').click();

    // 下拉菜单应该关闭
    cy.get('div[role="menu"]').should('not.exist');

    // 应该更新显示为中文
    cy.get('button').first().should('contain', '🇨🇳');

    // 检查 localStorage 应该更新
    cy.window().then(win => {
      expect(win.localStorage.getItem('preferred-language')).to.eq('zh');
    });
  });

  it('应该在点击外部区域时关闭下拉菜单', () => {
    // 打开下拉菜单
    cy.get('button').first().click();
    cy.get('div[role="menu"]').should('be.visible');

    // 点击文档上的其他位置
    cy.get('body').click(0, 0);

    // 下拉菜单应该关闭
    cy.get('div[role="menu"]').should('not.exist');
  });
});
