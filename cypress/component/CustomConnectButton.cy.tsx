import React from 'react';
import { mount } from 'cypress/react18';
import { CustomConnectButton } from '../../components/wallet/CustomConnectButton';
import { LanguageProvider } from '../../components/language/Context';

describe('CustomConnectButton 组件', () => {
  beforeEach(() => {
    // 模拟 ConnectButton.Custom 组件
    cy.stub(global, 'ConnectButton', {
      Custom: ({ children }) => {
        // 模拟 ConnectButton.Custom 的渲染
        return children({
          account: null,
          chain: null,
          openAccountModal: cy.stub(),
          openChainModal: cy.stub(),
          openConnectModal: cy.stub(),
          mounted: true,
        });
      },
    });

    // 挂载组件
    cy.mount(
      <LanguageProvider initialLanguage="zh">
        <CustomConnectButton />
      </LanguageProvider>,
    );
  });

  it('应该显示连接钱包按钮', () => {
    // 未连接状态下应该显示连接按钮
    cy.get('button').should('contain', /连接钱包|Connect Wallet/i);
    cy.get('button').should('be.visible');
    cy.get('svg').should('exist'); // 验证图标存在
  });

  it('应该处理连接点击事件', () => {
    // 模拟 openConnectModal 函数
    const openConnectModal = cy.stub();

    // 重新挂载组件
    cy.mount(
      <LanguageProvider initialLanguage="zh">
        <CustomConnectButton openConnectModal={openConnectModal} />
      </LanguageProvider>,
    );

    // 点击连接按钮
    cy.get('button').click();

    // 验证 openConnectModal 被调用
    expect(openConnectModal).to.be.called;
  });

  it('应该针对已连接状态渲染不同UI', () => {
    // 模拟已连接状态
    cy.stub(global, 'ConnectButton', {
      Custom: ({ children }) => {
        // 模拟 ConnectButton.Custom 的渲染 (已连接状态)
        return children({
          account: {
            displayName: '0x1234...5678',
            displayBalance: '1.5 ETH',
          },
          chain: {
            hasIcon: true,
            iconBackground: '#627EEA',
            iconUrl: 'https://example.com/ethereum.svg',
            name: 'Ethereum',
          },
          openAccountModal: cy.stub(),
          openChainModal: cy.stub(),
          openConnectModal: cy.stub(),
          mounted: true,
        });
      },
    });

    // 重新挂载组件
    cy.mount(
      <LanguageProvider initialLanguage="zh">
        <CustomConnectButton />
      </LanguageProvider>,
    );

    // 已连接状态下应该显示账户信息
    cy.get('button').should('contain', '0x1234...5678');
    cy.get('button').should('contain', 'Ethereum');
    cy.get('img[alt*="chain"]').should('exist');
  });
});
