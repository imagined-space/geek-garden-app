// ***********************************************************
// This example support/component.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Import global styles
// import '@/app/globals.css';

// Alternatively you can use CommonJS syntax:
// require('./commands')

import { mount } from 'cypress/react';

// Augment the Cypress namespace to include type definitions for
// your custom command.
declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof import('cypress/react').mount;
      ensureMountPoint(): Chainable;
      mockLocalStorage(key: string, value: string): Chainable;
      mockWeb3Environment(): Chainable;
    }
  }
}

Cypress.Commands.add('mount', mount);

// 添加一个辅助方法来确保挂载点存在
Cypress.Commands.add('ensureMountPoint', () => {
  cy.document().then(doc => {
    if (!doc.querySelector('[data-cy-root]')) {
      const mountPoint = doc.createElement('div');
      mountPoint.setAttribute('data-cy-root', '');
      doc.body.appendChild(mountPoint);
      cy.log('Created missing [data-cy-root] element');
    }
  });
});

// 模拟 localStorage
// Example use: cy.mockLocalStorage('preferred-language', 'en');
Cypress.Commands.add('mockLocalStorage', (key: string, value: string) => {
  cy.window().then(win => {
    win.localStorage.setItem(key, value);
  });
});

// 模拟 Web3 相关功能
Cypress.Commands.add('mockWeb3Environment', () => {
  cy.window().then(win => {
    // 模拟钱包连接状态
    win.ethereum = {
      isMetaMask: true,
      request: cy.stub().resolves(['0x1234567890abcdef1234567890abcdef12345678']),
      on: cy.stub(),
      removeListener: cy.stub(),
      isConnected: () => true,
      selectedAddress: '0x1234567890abcdef1234567890abcdef12345678',
      chainId: '0x1', // Ethereum Mainnet
      networkVersion: '1',
    };

    // 模拟 localStorage 中钱包状态
    win.localStorage.setItem('wagmi.connected', 'true');
    win.localStorage.setItem('wagmi.wallet', 'metamask');
  });
});


