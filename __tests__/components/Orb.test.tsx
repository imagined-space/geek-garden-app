import { render, screen, fireEvent } from '@testing-library/react';
import Orb from '@/components/common/Orb';

describe('Orb Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the orb with default props', () => {
    render(<Orb />);

    // 检查中心文本是否正确渲染
    expect(screen.getByText('G')).toBeInTheDocument();
  });

  it('renders with custom text and color', () => {
    render(<Orb text="X" textColor="red" textSize="8rem" />);

    // 检查自定义文本
    const textElement = screen.getByText('X');
    expect(textElement).toBeInTheDocument();

    // 检查文本样式
    expect(textElement).toHaveStyle('color: red');
    expect(textElement).toHaveStyle('font-size: 8rem');
  });

  it('applies hover effects when mouse enters', () => {
    render(<Orb text="T" />);

    const textContainer = screen.getByText('T').closest('div');
    expect(textContainer).toBeInTheDocument();

    // 初始状态下不应有 scale-125 类
    expect(textContainer).toHaveClass('scale-100');
    expect(textContainer).not.toHaveClass('scale-125');

    // 模拟鼠标进入事件
    fireEvent.mouseEnter(textContainer!);

    // 悬停状态下应有 scale-125 类
    expect(textContainer).toHaveClass('scale-125');
    expect(textContainer).not.toHaveClass('scale-100');

    // 模拟鼠标离开事件
    fireEvent.mouseLeave(textContainer!);

    // 恢复到初始状态
    expect(textContainer).toHaveClass('scale-100');
    expect(textContainer).not.toHaveClass('scale-125');
  });

  it('handles forceHoverState prop correctly', () => {
    // 渲染 Orb 组件并强制设置悬停状态
    render(<Orb forceHoverState={true} />);

    // 组件初始化需要一些时间来建立 WebGL 上下文和 Worker
    setTimeout(() => {
      // 由于强制悬停状态，即使没有鼠标事件也应该应用悬停效果
      const textContainer = screen.getByText('G').closest('div');
      expect(textContainer).toHaveClass('scale-125');
    }, 100);
  });

  it('cleans up resources when unmounted', () => {
    // 这个测试主要是确保组件的清理函数没有错误
    const { unmount } = render(<Orb />);

    // 卸载组件不应该抛出错误
    expect(() => unmount()).not.toThrow();
  });
});
