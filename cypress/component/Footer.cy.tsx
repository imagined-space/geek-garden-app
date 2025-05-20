import React from 'react';
import { mount } from 'cypress/react18';
import Footer from '../../components/common/Footer';
import { LanguageProvider } from '../../components/language/Context';

describe('Footer 组件', () => {
  beforeEach(() => {
    // 挂载组件
    cy.mount(
      <LanguageProvider initialLanguage="zh">
        <Footer />
      </LanguageProvider>,
    );
  });

  it('应该渲染页脚内容', () => {
    // 验证页脚存在
    cy.get('footer').should('exist');

    // 验证链接存在
    cy.get('footer a[href="/"]').should('exist');
    cy.get('footer a[href="/about"]').should('exist');
    cy.get('footer a[href="/contact"]').should('exist');

    // 验证社交媒体图标存在
    cy.get('footer a[href*="facebook.com"]').should('exist');
    cy.get('footer a[href*="twitter.com"]').should('exist');
    cy.get('footer a[href*="instagram.com"]').should('exist');
    cy.get('footer a[href*="linkedin.com"]').should('exist');

    // 验证版权信息存在
    cy.get('footer p').should('exist');
  });

  it('应该有装饰元素', () => {
    // 验证装饰性元素存在
    cy.get('footer .cyber-divider').should('exist');
    cy.get('footer .marquee').should('exist');
    cy.get('footer .opacity-5').should('exist');
  });
});
