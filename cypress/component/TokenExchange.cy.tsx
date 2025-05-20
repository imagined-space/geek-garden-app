import React from 'react';
import { mount } from 'cypress/react18';
import { TokenExchange } from '../../components/market/TokenExchange';
import { LanguageProvider } from '../../components/language/Context';
import { JotaiProvider } from 'jotai';

describe('TokenExchange 组件', () => {
  beforeEach(() => {
    // 模拟钱包连接状态
    cy.window().then(win => {
      win.useAtom = cy.stub().returns([true]); // 模拟钱包已连接
    });

    // 模拟tokenExchange hook
    cy.window().then(win => {
      win.useTokenExchange = cy.stub().returns({
        address: '0x1234567890abcdef',
        amount: '',
        setAmount: cy.stub(),
        isBuying: true,
        setIsBuying: cy.stub(),
        ethBalance: '1.5',
        ydBalance: '1000',
        isCorrectNetwork: true,
        isPending: false,
        isConfirming: false,
        contractAddress: '0xContract',
        handleSwitchNetwork: cy.stub(),
        handleTransaction: cy.stub(),
      });
    });

    // 挂载组件
    cy.mount(
      <JotaiProvider>
        <LanguageProvider initialLanguage="zh">
          <TokenExchange />
        </LanguageProvider>
      </JotaiProvider>,
    );
  });

  it('应该正确渲染交易界面', () => {
    // 验证界面元素
    cy.get('h2').should('contain', /购买|买入|交易/);
    cy.get('p')
      .contains(/ETH|以太/)
      .should('exist');
    cy.get('p').contains(/YD|G/).should('exist');
    cy.get('button').contains('⇄').should('exist');
    cy.get('input[type="number"]').should('exist');
    cy.get('button')
      .contains(/确认|confirm/i)
      .should('exist');
  });

  it('应该允许输入交易数量', () => {
    // 输入交易数量
    cy.get('input[type="number"]').type('0.5');
    cy.get('input[type="number"]').should('have.value', '0.5');

    // 应该显示估算值
    cy.get('p')
      .contains(/estimated|估算/i)
      .should('contain', '500');
  });

  it('应该允许切换交易方向', () => {
    // 记录初始状态
    cy.get('h2').then($h2 => {
      const initialText = $h2.text();

      // 点击切换按钮
      cy.get('button').contains('⇄').click();

      // 标题应该变化
      cy.get('h2').should($newH2 => {
        expect($newH2.text()).not.to.eq(initialText);
      });
    });
  });

  it('应该处理交易确认点击事件', () => {
    // 模拟交易处理函数
    cy.window().then(win => {
      win.handleTransaction = cy.spy();
    });

    // 输入数量
    cy.get('input[type="number"]').type('0.5');

    // 点击确认按钮
    cy.get('button')
      .contains(/确认|confirm/i)
      .click();

    // 验证函数调用
    cy.window().its('handleTransaction').should('be.called');
  });
});
