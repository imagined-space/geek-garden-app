// Header.cy.tsx
import React from 'react';
import { LanguageProvider } from '@components/language/Context';
import { Provider } from 'jotai';
// 导入测试组件
import TestHeader from './TestHeader';
import TestCourseSection from './TestCourseSection';
import TestFooter from './TestFooter';

// 添加模拟课程数据
const mockCourses = [
  { id: 1, title: 'Web3基础' },
  { id: 2, title: '智能合约开发' },
  { id: 3, title: 'DApp前端开发' },
];

// 处理未捕获的异常
Cypress.on('uncaught:exception', err => {
  // 如果是Wagmi相关的错误，忽略它
  if (err.message.includes('wagmi') || err.message.includes('WagmiProvider')) {
    return false;
  }
  // 其他错误继续抛出
  return true;
});

describe('Header 组件测试', () => {
  beforeEach(() => {
    // 挂载组件
    cy.viewport(1280, 720); // 设置合理的视口尺寸
    cy.mount(
      <Provider>
        <LanguageProvider initialLanguage="zh">
          <div className="min-h-screen flex flex-col">
            <TestHeader />
            <main className="flex-grow">
              <TestCourseSection courses={mockCourses} />
            </main>
            <TestFooter />
          </div>
        </LanguageProvider>
      </Provider>,
    );

    // 验证页面结构
    cy.get('header').should('exist');
    cy.get('main').should('exist');
    cy.get('footer').should('exist');

    // 验证导航链接
    cy.get('header a[href="/"]').should('exist');
    cy.get('header a[href="/knowledge"]').should('exist');
    cy.get('header a[href="/market"]').should('exist');

    // 验证课程卡片
    cy.get('.grid').children().should('have.length', mockCourses.length);

    // 验证页脚链接
    cy.get('footer a[href="/"]').should('exist');
    cy.get('footer a[href="/about"]').should('exist');
    cy.get('footer a[href="/contact"]').should('exist');
  });

  it('应该测试语言切换效果', () => {
    // 挂载组件
    cy.mount(
      <Provider>
        <LanguageProvider initialLanguage="en">
          <div className="min-h-screen flex flex-col">
            <TestHeader />
            <main className="flex-grow">
              <TestCourseSection courses={mockCourses} />
            </main>
            <TestFooter />
          </div>
        </LanguageProvider>
      </Provider>,
    );

    // 获取初始英文标题文本
    let englishText = '';
    cy.get('h2.cyberpunk-title')
      .should('be.visible')
      .invoke('text')
      .then(text => {
        englishText = text;
        cy.log(`英文标题: ${englishText}`);
      });

    // 找到语言切换器并点击
    cy.get('[data-testid="language-switcher"]').should('be.visible').click();

    // 添加等待，确保下拉菜单显示
    cy.wait(200);

    // 选择中文
    cy.get('[data-testid="language-option-zh"]').should('be.visible').click();

    // 添加等待确保UI更新
    cy.wait(200);

    // 验证语言变化
    cy.get('h2.cyberpunk-title')
      .should('be.visible')
      .invoke('text')
      .then(chineseText => {
        cy.log(`中文标题: ${chineseText}`);
        expect(chineseText).not.to.equal(englishText);
      });
  });
});
