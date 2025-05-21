import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PageNotFoundView from '@/components/common/PageNotFoundView';
import { useRouter } from 'next/navigation';

// 模拟 next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('PageNotFoundView Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // 模拟 useRouter
    (useRouter as jest.Mock).mockReturnValue({
      back: jest.fn(),
    });
  });

  it('renders 404 error message', () => {
    render(<PageNotFoundView />);

    // 验证 404 标题
    expect(screen.getByText('404')).toBeInTheDocument();

    // 验证错误消息
    expect(screen.getByText('系统错误')).toBeInTheDocument();
  });

  it('starts with empty terminal text and then types out the message', async () => {
    jest.useFakeTimers();

    render(<PageNotFoundView />);

    // 初始状态下终端应该为空或只有光标
    const terminalPre = screen.getByText(/^$|正在/);

    // 前进一小段时间，此时应该已经打印出一部分文本
    jest.advanceTimersByTime(500);
    expect(terminalPre.textContent).toContain('正在尝试连接至请求资源');

    // 前进足够的时间，应该完成整个终端文本输出
    jest.advanceTimersByTime(3000);
    expect(terminalPre.textContent).toContain('连接失败: 资源不存在或已被移除');

    jest.useRealTimers();
  });

  it('navigates back when clicking the return button', () => {
    const mockBack = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      back: mockBack,
    });

    render(<PageNotFoundView />);

    // 点击返回上页按钮
    const backButton = screen.getByText('返回上页');
    fireEvent.click(backButton);

    // 验证是否调用了 router.back()
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('has a link to home page', () => {
    render(<PageNotFoundView />);

    // 验证返回首页链接
    const homeLink = screen.getByText('返回首页');
    expect(homeLink.closest('a')).toHaveAttribute('href', '/');
  });

  it('applies glitch effect periodically', async () => {
    jest.useFakeTimers();

    render(<PageNotFoundView />);

    // 获取 404 标题元素
    const title = screen.getByText('404');

    // 初始状态下不应该有闪烁效果
    expect(title).not.toHaveClass('cyberpunk-glitch');

    // 推进时间，触发闪烁效果
    jest.advanceTimersByTime(3000);
    expect(title).toHaveClass('cyberpunk-glitch');

    // 闪烁效果应该很快消失
    jest.advanceTimersByTime(200);
    expect(title).not.toHaveClass('cyberpunk-glitch');

    jest.useRealTimers();
  });
});
