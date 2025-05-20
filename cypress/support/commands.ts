// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

interface CustomWindow extends Window {
  useAtom?: (...args: any[]) => [any, (...args: any[]) => void];
}

// -- This is a parent command --
Cypress.Commands.add('login', (email, password) => {
  // 模拟登录操作
  cy.log(`Logging in as ${email}`);
});

// -- This is a child command --
Cypress.Commands.add('drag', { prevSubject: 'element' }, (subject, options) => {
  // 模拟拖拽操作
});

// -- This is a dual command --
Cypress.Commands.add('dismiss', { prevSubject: 'optional' }, (subject, options) => {
  // 模拟关闭操作
});

// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// 强制等待 - 慎用，仅在绝对必要时使用
Cypress.Commands.add('forceWait', (ms: number) => {
  cy.wait(ms);
});

// 检查元素是否可见并且有内容
Cypress.Commands.add('shouldBeVisibleWithContent', { prevSubject: true }, subject => {
  cy.wrap(subject).should('be.visible');
  cy.wrap(subject).invoke('text').should('not.be.empty');
  return cy.wrap(subject);
});

// 模拟网络请求
Cypress.Commands.add(
  'mockNetworkRequest',
  (url: string, response: any, statusCode: number = 200) => {
    cy.intercept(url, {
      statusCode,
      body: response,
    }).as('mockedRequest');
  },
);

// 模拟图表数据
Cypress.Commands.add('mockChartData', () => {
  cy.intercept('https://api.geckoterminal.com/api/v2/networks/*/pools/*/ohlcv/*', {
    statusCode: 200,
    body: {
      data: {
        attributes: {
          ohlcv_list: Array(30)
            .fill(0)
            .map((_, i) => [
              Date.now() - i * 86400000, // 时间戳 (每天一个数据点)
              Math.random() * 100 + 200, // 开盘价
              Math.random() * 100 + 250, // 最高价
              Math.random() * 100 + 150, // 最低价
              Math.random() * 100 + 200, // 收盘价
              Math.random() * 10000 + 5000, // 成交量
            ]),
        },
      },
      meta: {
        base: {
          name: 'YiDeng Coin',
          symbol: 'GC',
        },
        quote: {
          name: 'US Dollar',
          symbol: 'USD',
        },
      },
    },
  }).as('chartData');
});

// 检查页面上是否显示钱包地址
Cypress.Commands.add('hasWalletAddress', () => {
  return cy.get('body').then($body => {
    const bodyText = $body.text();
    const hasAddress = bodyText.match(/0x[a-fA-F0-9]{4,}/) !== null;
    return hasAddress;
  });
});

// 创建并注入模拟的以太坊对象
Cypress.Commands.add(
  'mockWeb3Environment',
  (address = '0xF226d4125fC81100bf0b7A7a3e9F9C2dE9B76a3f') => {
    // 以太坊事件回调类型定义
    type EthereumEventCallback = (...args: any[]) => void;

    // 以太坊事件存储结构类型定义
    interface EventsMap {
      [key: string]: EthereumEventCallback[];
    }

    cy.log(`使用地址初始化Web3环境: ${address}`);

    cy.visit('/', {
      onBeforeLoad(win) {
        // 记录原始环境
        cy.log('页面加载前，准备注入模拟以太坊对象');

        // 检查是否已存在以太坊对象
        const hasExistingEthereum = !!win.ethereum;
        if (hasExistingEthereum) {
          cy.log('检测到页面已有ethereum对象，将被覆盖');
        }

        // 备份原始localStorage方法
        const originalGetItem = win.localStorage.getItem;
        const originalSetItem = win.localStorage.setItem;
        const originalRemoveItem = win.localStorage.removeItem;

        // 创建模拟的以太坊对象 - 使用更完整的实现
        const mockEthereum = {
          isMetaMask: true,
          isCoinbaseWallet: false,
          isWalletConnect: false,

          // 状态属性
          chainId: '0x1', // 默认为以太坊主网
          networkVersion: '1',
          selectedAddress: address,
          isConnected: () => !!mockEthereum.selectedAddress,

          // 存储已注册的事件监听器
          _events: {} as EventsMap,

          // 模拟request方法 - 支持更多请求类型
          request: cy.stub().callsFake((request: { method: string; params?: any[] }) => {
            cy.log(`模拟Ethereum请求: ${request.method}`);

            // 根据请求类型返回不同的响应
            if (request.method === 'eth_accounts' || request.method === 'eth_requestAccounts') {
              return mockEthereum.selectedAddress
                ? Promise.resolve([mockEthereum.selectedAddress])
                : Promise.resolve([]);
            }

            if (request.method === 'eth_chainId') {
              return Promise.resolve(mockEthereum.chainId);
            }

            if (request.method === 'net_version') {
              return Promise.resolve(mockEthereum.networkVersion);
            }

            if (request.method === 'eth_getBalance') {
              // 模拟返回余额 (1 ETH)
              return Promise.resolve('0xDE0B6B3A7640000'); // 1 ETH in wei
            }

            if (request.method === 'personal_sign') {
              // 生成一个随机签名
              const randomSignature =
                '0x' +
                Array(130)
                  .fill(0)
                  .map(() => '0123456789abcdef'[Math.floor(Math.random() * 16)])
                  .join('');
              return Promise.resolve(randomSignature);
            }

            if (request.method === 'wallet_switchEthereumChain') {
              const chainIdParam = request.params?.[0]?.chainId;
              if (chainIdParam) {
                mockEthereum.chainId = chainIdParam;
                mockEthereum.networkVersion =
                  chainIdParam === '0x1'
                    ? '1'
                    : chainIdParam === '0x89'
                      ? '137'
                      : chainIdParam === '0xa'
                        ? '10'
                        : chainIdParam === '0xa4b1'
                          ? '42161'
                          : '1';

                // 触发链变更事件
                mockEthereum._triggerEvent('chainChanged', chainIdParam);
                return Promise.resolve(null);
              }
            }

            // 默认返回null
            cy.log(`未处理的Ethereum请求方法: ${request.method}`);
            return Promise.resolve(null);
          }),

          // 事件处理方法
          on: cy.stub().callsFake((eventName: string, callback: EthereumEventCallback) => {
            cy.log(`Ethereum注册事件监听: ${eventName}`);
            if (!mockEthereum._events[eventName]) {
              mockEthereum._events[eventName] = [];
            }
            mockEthereum._events[eventName].push(callback);
            return mockEthereum;
          }),

          removeListener: cy
            .stub()
            .callsFake((eventName: string, callback: EthereumEventCallback) => {
              cy.log(`Ethereum移除事件监听: ${eventName}`);
              if (mockEthereum._events[eventName]) {
                mockEthereum._events[eventName] = mockEthereum._events[eventName].filter(
                  (cb: EthereumEventCallback) => cb !== callback,
                );
              }
              return mockEthereum;
            }),

          // 触发事件的辅助方法
          _triggerEvent: (eventName: string, ...args: any[]) => {
            cy.log(`Ethereum触发事件: ${eventName} 参数:`, args);
            if (mockEthereum._events[eventName]) {
              mockEthereum._events[eventName].forEach((callback: EthereumEventCallback) => {
                try {
                  callback(...args);
                } catch (e) {
                  cy.log(`事件回调执行错误 (${eventName}): ${e}`);
                }
              });
            } else {
              cy.log(`没有监听器处理事件: ${eventName}`);
            }
          },

          // 旧版方法支持
          enable: () =>
            Promise.resolve(mockEthereum.selectedAddress ? [mockEthereum.selectedAddress] : []),

          // 模拟 sendAsync 方法 (旧版API)
          sendAsync: cy
            .stub()
            .callsFake((payload: any, callback: (error: Error | null, result?: any) => void) => {
              cy.log(`模拟Ethereum.sendAsync调用: ${payload.method || '未知方法'}`);

              try {
                if (payload.method === 'eth_accounts') {
                  callback(null, {
                    result: mockEthereum.selectedAddress ? [mockEthereum.selectedAddress] : [],
                  });
                } else if (payload.method === 'eth_chainId') {
                  callback(null, { result: mockEthereum.chainId });
                } else if (payload.method === 'net_version') {
                  callback(null, { result: mockEthereum.networkVersion });
                } else if (payload.method === 'personal_sign') {
                  // 生成随机签名
                  const sig =
                    '0x' +
                    Array(130)
                      .fill(0)
                      .map(() => '0123456789abcdef'[Math.floor(Math.random() * 16)])
                      .join('');
                  callback(null, { result: sig });
                } else {
                  callback(null, { result: null });
                }
              } catch (e) {
                callback(new Error(`sendAsync执行错误: ${e}`));
              }
            }),

          // 模拟 send 方法 (兼容不同形式调用)
          send: cy.stub().callsFake((payloadOrMethod: any, callbackOrParams?: any) => {
            cy.log(`模拟Ethereum.send调用`);

            // 处理不同的调用方式
            if (typeof payloadOrMethod === 'string') {
              // 形式: send(method, params?)
              const method = payloadOrMethod;

              if (method === 'eth_accounts') {
                return {
                  result: mockEthereum.selectedAddress ? [mockEthereum.selectedAddress] : [],
                };
              } else if (method === 'eth_chainId') {
                return { result: mockEthereum.chainId };
              } else {
                return { result: null };
              }
            } else if (typeof callbackOrParams === 'function') {
              // 形式: send(payload, callback)
              const payload = payloadOrMethod;
              const callback = callbackOrParams;

              try {
                if (payload.method === 'eth_accounts') {
                  callback(null, {
                    result: mockEthereum.selectedAddress ? [mockEthereum.selectedAddress] : [],
                  });
                } else if (payload.method === 'eth_chainId') {
                  callback(null, { result: mockEthereum.chainId });
                } else {
                  callback(null, { result: null });
                }
              } catch (e) {
                callback(new Error(`send执行错误: ${e}`));
              }
            } else {
              // 形式: send(payload) - 返回结果
              const payload = payloadOrMethod;

              if (payload.method === 'eth_accounts') {
                return {
                  result: mockEthereum.selectedAddress ? [mockEthereum.selectedAddress] : [],
                };
              } else if (payload.method === 'eth_chainId') {
                return { result: mockEthereum.chainId };
              } else {
                return { result: null };
              }
            }
          }),
        };

        // 模拟localStorage - 使用更详细的日志
        cy.stub(win.localStorage, 'getItem').callsFake((key: string) => {
          cy.log(`模拟localStorage.getItem: ${key}`);

          // 处理钱包相关的键
          if (
            key.includes('wallet') ||
            key.includes('web3') ||
            key.includes('metamask') ||
            key.includes('connect')
          ) {
            // 返回模拟的连接数据
            const mockData = JSON.stringify({
              connected: !!mockEthereum.selectedAddress,
              address: mockEthereum.selectedAddress,
              chainId:
                mockEthereum.chainId === '0x1'
                  ? 1
                  : mockEthereum.chainId === '0x89'
                    ? 137
                    : parseInt(mockEthereum.chainId, 16),
              provider: 'metamask',
              timestamp: Date.now(),
            });

            cy.log(`返回模拟钱包数据: ${mockData}`);
            return mockData;
          }

          // 其他键使用原始方法
          return originalGetItem.call(win.localStorage, key);
        });

        // 模拟localStorage.setItem
        cy.stub(win.localStorage, 'setItem').callsFake((key: string, value: string) => {
          cy.log(`模拟localStorage.setItem: ${key} = ${value}`);

          // 监听钱包相关的键
          if (
            key.includes('wallet') ||
            key.includes('web3') ||
            key.includes('metamask') ||
            key.includes('connect')
          ) {
            try {
              // 尝试解析值，可能包含连接状态
              const data = JSON.parse(value);
              if (data.address && data.connected) {
                cy.log(`检测到钱包连接状态变更: 已连接，地址=${data.address}`);
                mockEthereum.selectedAddress = data.address;

                // 可能需要触发连接事件
                if (!mockEthereum._hasTriggeredConnect) {
                  mockEthereum._hasTriggeredConnect = true;
                  mockEthereum._triggerEvent('connect', { chainId: mockEthereum.chainId });
                  mockEthereum._triggerEvent('accountsChanged', [data.address]);
                }
              } else if (data.connected === false) {
                cy.log(`检测到钱包连接状态变更: 已断开连接`);
                mockEthereum.selectedAddress = null;

                // 触发断开连接事件
                mockEthereum._triggerEvent('accountsChanged', []);
                mockEthereum._triggerEvent('disconnect', {
                  code: 1000,
                  reason: 'User disconnected',
                });
              }
            } catch (e) {
              cy.log(`解析localStorage值失败: ${e}`);
            }

            // 不实际设置localStorage，仅记录
            return;
          }

          // 其他键使用原始方法
          return originalSetItem.call(win.localStorage, key, value);
        });

        // 模拟localStorage.removeItem
        cy.stub(win.localStorage, 'removeItem').callsFake((key: string) => {
          cy.log(`模拟localStorage.removeItem: ${key}`);

          // 监听钱包相关的键
          if (
            key.includes('wallet') ||
            key.includes('web3') ||
            key.includes('metamask') ||
            key.includes('connect')
          ) {
            cy.log(`检测到钱包存储项被移除: ${key}`);

            // 可能是断开连接的信号
            if (mockEthereum.selectedAddress) {
              cy.log('由于localStorage项被移除，触发钱包断开连接事件');
              mockEthereum.selectedAddress = null;
              mockEthereum._triggerEvent('accountsChanged', []);
              mockEthereum._triggerEvent('disconnect', { code: 1000, reason: 'User disconnected' });
            }

            return;
          }

          // 其他键使用原始方法
          return originalRemoveItem.call(win.localStorage, key);
        });

        // 注入模拟对象
        win.ethereum = mockEthereum;
        win._mockEthereum = mockEthereum;

        // 模拟WalletConnect库 - 更详细的实现
        win.WalletConnectClient = {
          init: cy.stub().callsFake(() => {
            cy.log('模拟WalletConnectClient.init()');
            return Promise.resolve({
              connect: cy.stub().callsFake(() => {
                cy.log('模拟WalletConnectClient.connect()');
                // 连接成功后更新mockEthereum
                mockEthereum.isWalletConnect = true;
                mockEthereum.isMetaMask = false;
                mockEthereum.selectedAddress = address;

                // 触发连接事件
                setTimeout(() => {
                  mockEthereum._triggerEvent('connect', { chainId: mockEthereum.chainId });
                  mockEthereum._triggerEvent('accountsChanged', [address]);
                }, 100);

                return Promise.resolve({
                  accounts: [address],
                  chainId: parseInt(mockEthereum.chainId, 16),
                });
              }),
              disconnect: cy.stub().callsFake(() => {
                cy.log('模拟WalletConnectClient.disconnect()');
                mockEthereum.selectedAddress = null;

                // 触发断开连接事件
                setTimeout(() => {
                  mockEthereum._triggerEvent('accountsChanged', []);
                  mockEthereum._triggerEvent('disconnect', {
                    code: 1000,
                    reason: 'User disconnected',
                  });
                }, 100);

                return Promise.resolve();
              }),
              on: (event: string, callback: any) => {
                cy.log(`模拟WalletConnectClient.on(${event})`);
                // 将WalletConnect事件转发到mockEthereum
                mockEthereum.on(event, callback);
              },
            });
          }),
        };

        // 添加辅助方法 - 直接连接钱包
        win._connectWallet = () => {
          cy.log('调用_connectWallet辅助方法');

          if (!mockEthereum.selectedAddress) {
            mockEthereum.selectedAddress = address;

            // 触发连接事件
            setTimeout(() => {
              mockEthereum._triggerEvent('connect', { chainId: mockEthereum.chainId });
              mockEthereum._triggerEvent('accountsChanged', [address]);
            }, 100);
          }

          return Promise.resolve([address]);
        };

        // 添加辅助方法 - 直接断开连接
        win._disconnectWallet = () => {
          cy.log('调用_disconnectWallet辅助方法');

          if (mockEthereum.selectedAddress) {
            mockEthereum.selectedAddress = null;

            // 触发断开连接事件
            setTimeout(() => {
              mockEthereum._triggerEvent('accountsChanged', []);
              mockEthereum._triggerEvent('disconnect', { code: 1000, reason: 'User disconnected' });
            }, 100);
          }

          return Promise.resolve();
        };
      },
      timeout: 30000,
    });

    // 等待页面加载
    cy.wait(3000);
    cy.log('Web3环境初始化完成');
  },
);

declare global {
  // 扩展Window接口
  interface Window {
    _mockEthereum: any;
    ethereum: any;
    useAtom?: (...args: any[]) => [any, (...args: any[]) => void];
    WalletConnectClient: {
      init: () => Promise<{
        connect: () => Promise<{
          accounts: string[];
          chainId: number;
        }>;
      }>;
    };
  }

  namespace Cypress {
    // 扩展AUTWindow接口继承Window接口的扩展
    interface AUTWindow extends Window {
      _mockEthereum: any;
      ethereum: any;
      useAtom?: (...args: any[]) => [any, (...args: any[]) => void];
      WalletConnectClient: {
        init: () => Promise<{
          connect: () => Promise<{
            accounts: string[];
            chainId: number;
          }>;
        }>;
      };
    }

    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      drag(options?: any): Chainable<Element>;
      dismiss(options?: any): Chainable<Element>;
      forceWait(ms: number): Chainable<void>;
      shouldBeVisibleWithContent(): Chainable<Element>;
      mockNetworkRequest(url: string, response: any, statusCode?: number): Chainable<void>;
      mockChartData(): Chainable<void>;
      mockCourseData(purchased?: boolean): Chainable<void>;
      mockWeb3Environment(address?: string): Chainable<void>;
      mockLanguage(language: string): Chainable<void>;
      mockLocalStorage(key: string, value: string): Chainable<void>;

      // 修改Web3钱包命令的返回类型，使其更加准确
      findWalletButton(): Chainable<JQuery<HTMLElement> | null>;
      hasWalletAddress(): Chainable<boolean>;
      connectWallet(): Chainable<void>;
      checkWalletConnection(): Chainable<{
        isConnected: boolean;
        walletAddress: string | null;
        hasConnectedIndicator: boolean;
      }>;
      switchNetwork(chainId: string, networkName: string): Chainable<void>;
      disconnectWallet(): Chainable<void>;
    }
  }
}

export {};
