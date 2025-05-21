import { render, screen, fireEvent } from '@testing-library/react';
import Header from '@/components/common/Header';

// 由于 Header 组件使用了很多依赖，这里需要模拟这些依赖
jest.mock('@components/language/Switcher', () => {
  return function MockLanguageSwitcher() {
    return <div data-testid="language-switcher">Language Switcher</div>;
  };
});

jest.mock('@components/wallet/CustomConnectButton', () => ({
  CustomConnectButton: function MockCustomConnectButton() {
    return <button data-testid="connect-wallet-button">Connect Wallet</button>;
  },
}));

describe('Header Component', () => {
  beforeEach(() => {
    // 重置 window.scrollY
    Object.defineProperty(window, 'scrollY', {
      value: 0,
      writable: true,
    });

    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(<Header />);

    // 验证 logo 是否存在
    expect(screen.getByText('Web3 University')).toBeInTheDocument();

    // 验证导航链接
    expect(screen.getByText('nav.home')).toBeInTheDocument();
    expect(screen.getByText('nav.knowledgeBase')).toBeInTheDocument();
    expect(screen.getByText('nav.market')).toBeInTheDocument();

    // 验证语言切换和钱包按钮
    expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
    expect(screen.getByTestId('connect-wallet-button')).toBeInTheDocument();
  });

  it('applies scroll effects when scrolled', () => {
    render(<Header />);

    // 初始状态不应该有阴影类
    const header = screen.getByRole('banner');
    expect(header).not.toHaveClass('shadow-lg');

    // 模拟滚动事件
    Object.defineProperty(window, 'scrollY', { value: 100, writable: true });
    fireEvent.scroll(window);

    // 应用滚动效果后应该有阴影类
    expect(header).toHaveClass('shadow-lg');
  });

  it('toggles mobile menu when clicked', () => {
    render(<Header />);

    // 初始状态下移动菜单应该不可见
    expect(screen.queryByText('nav.home', { selector: '.md\\:hidden a' })).not.toBeInTheDocument();

    // 点击汉堡菜单按钮
    const menuButton = screen.getByLabelText('打开导航菜单');
    fireEvent.click(menuButton);

    // 移动菜单现在应该可见
    expect(screen.getByText('nav.home', { selector: '.md\\:hidden a' })).toBeInTheDocument();

    // 再次点击关闭菜单
    fireEvent.click(menuButton);

    // 移动菜单现在应该不可见
    expect(screen.queryByText('nav.home', { selector: '.md\\:hidden a' })).not.toBeInTheDocument();
  });
});
