import React from 'react';
import { mount } from 'cypress/react18';
import PageNotFoundView from '../../components/common/PageNotFoundView';

describe('PageNotFoundView 组件', () => {
  beforeEach(() => {
    // 模拟 Next.js 路由器
    cy.window().then(win => {
      win.useRouter = cy.stub().returns({
        back: cy.stub(),
      });
    });

    // 挂载组件
    cy.mount(<PageNotFoundView />);
  });

  it('应该渲染404错误页面', () => {
    // 验证404标题
    cy.get('h1').should('contain', '404');

    // 验证错误消息
    cy.get('h2').should('contain', /错误|Error/i);

    // 验证终端文本区域存在
    cy.get('pre').should('exist');

    // 验证按钮存在
    cy.get('button').should('have.length', 1);
    cy.get('a[href="/"]').should('exist');
  });

  it('应该支持点击返回按钮', () => {
    // 点击返回按钮
    cy.get('button').contains(/返回/i).click();

    // 验证 router.back 被调用
    cy.window().then(win => {
      expect(win.useRouter()).back.to.be.called;
    });
  });

  it('应该有动画效果', () => {
    // 验证终端区域有打字效果 (文本会随时间变化)
    const initialText = cy.get('pre').invoke('text');
    cy.wait(1000);
    cy.get('pre').invoke('text').should('have.length.greaterThan', initialText.length);

    // 验证动画类存在
    cy.get('span').should('have.class', 'animate-pulse');
  });
});
