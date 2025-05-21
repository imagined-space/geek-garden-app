/**
 * 这是钱包连接按钮的测试示例
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { CustomConnectButton } from '@/components/wallet/CustomConnectButton';

// 模拟 Web3React 钩子
jest.mock('@web3-react/core', () => ({
  useWeb3React: jest.fn(),
}));

// 模拟 RainbowKit 组件
jest.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: {
    Custom: ({ children }) => {
      // 模拟 RainbowKit 的 Custom 组件，将模拟状态传递给子函数
      return children({
        account: {
          address: '0x1234567890123456789012345678901234567890',
          displayName: '0x1234...7890',
          displayBalance: '1.5 ETH',
        },
        chain: {
          hasIcon: true,
          iconUrl: 'https://example.com/icon.png',
          iconBackground: '#fff',
          id: 1,
          name: 'Ethereum',
          unsupported: false,
        },
        openAccountModal: jest.fn(),
        openChainModal: jest.fn(),
        openConnectModal: jest.fn(),
        authenticationStatus: 'authenticated',
        mounted: true,
      });
    },
  },
}));

describe('CustomConnectButton Component', () => {
  // 测试不同的钱包状态
  const testCases = [
    {
      name: 'renders connect button when wallet is not connected',
      mockState: {
        active: false,
        account: null,
      },
      expectedButtonText: 'Connect Wallet',
    },
    {
      name: 'renders account info when wallet is connected',
      mockState: {
        active: true,
        account: '0x1234567890123456789012345678901234567890',
      },
      expectedButtonText: '0x1234...7890',
    },
  ];

  testCases.forEach(({ name, mockState, expectedButtonText }) => {
    it(name, () => {
      // 设置 Web3React 的模拟返回值
      require('@web3-react/core').useWeb3React.mockReturnValue(mockState);

      render(<CustomConnectButton />);

      // 验证按钮文本
      expect(screen.getByText(expectedButtonText)).toBeInTheDocument();
    });
  });

  it('opens connect modal when clicking connect button', () => {
    // 设置未连接的状态
    require('@web3-react/core').useWeb3React.mockReturnValue({
      active: false,
      account: null,
    });

    // 模拟 RainbowKit 的 openConnectModal 函数
    const openConnectModal = jest.fn();
    jest
      .spyOn(require('@rainbow-me/rainbowkit').ConnectButton, 'Custom')
      .mockImplementation(({ children }) => {
        return children({
          account: null,
          chain: null,
          openAccountModal: jest.fn(),
          openChainModal: jest.fn(),
          openConnectModal,
          authenticationStatus: 'unauthenticated',
          mounted: true,
        });
      });

    render(<CustomConnectButton />);

    // 点击连接按钮
    fireEvent.click(screen.getByText('Connect Wallet'));

    // 验证是否调用了 openConnectModal
    expect(openConnectModal).toHaveBeenCalled();
  });

  it('opens account modal when clicking on connected account', () => {
    // 设置已连接的状态
    require('@web3-react/core').useWeb3React.mockReturnValue({
      active: true,
      account: '0x1234567890123456789012345678901234567890',
    });

    // 模拟 RainbowKit 的 openAccountModal 函数
    const openAccountModal = jest.fn();
    jest
      .spyOn(require('@rainbow-me/rainbowkit').ConnectButton, 'Custom')
      .mockImplementation(({ children }) => {
        return children({
          account: {
            address: '0x1234567890123456789012345678901234567890',
            displayName: '0x1234...7890',
            displayBalance: '1.5 ETH',
          },
          chain: {
            hasIcon: true,
            iconUrl: 'https://example.com/icon.png',
            iconBackground: '#fff',
            id: 1,
            name: 'Ethereum',
            unsupported: false,
          },
          openAccountModal,
          openChainModal: jest.fn(),
          openConnectModal: jest.fn(),
          authenticationStatus: 'authenticated',
          mounted: true,
        });
      });

    render(<CustomConnectButton />);

    // 点击已连接的账户按钮
    fireEvent.click(screen.getByText('0x1234...7890'));

    // 验证是否调用了 openAccountModal
    expect(openAccountModal).toHaveBeenCalled();
  });

  it('handles unsupported network', () => {
    // 设置已连接但网络不支持的状态
    require('@web3-react/core').useWeb3React.mockReturnValue({
      active: true,
      account: '0x1234567890123456789012345678901234567890',
    });

    // 模拟 RainbowKit 的返回值，设置 unsupported 为 true
    const openChainModal = jest.fn();
    jest
      .spyOn(require('@rainbow-me/rainbowkit').ConnectButton, 'Custom')
      .mockImplementation(({ children }) => {
        return children({
          account: {
            address: '0x1234567890123456789012345678901234567890',
            displayName: '0x1234...7890',
            displayBalance: '1.5 ETH',
          },
          chain: {
            hasIcon: true,
            iconUrl: 'https://example.com/icon.png',
            iconBackground: '#fff',
            id: 1,
            name: 'Ethereum',
            unsupported: true,
          },
          openAccountModal: jest.fn(),
          openChainModal,
          openConnectModal: jest.fn(),
          authenticationStatus: 'authenticated',
          mounted: true,
        });
      });

    render(<CustomConnectButton />);

    // 验证是否显示网络错误信息
    expect(screen.getByText('Wrong Network')).toBeInTheDocument();

    // 点击网络切换按钮
    fireEvent.click(screen.getByText('Wrong Network'));

    // 验证是否调用了 openChainModal
    expect(openChainModal).toHaveBeenCalled();
  });
});
