import { render } from '@testing-library/react';
import MainLayout from '@/components/common/MainLayout';

describe('MainLayout Component', () => {
  it('renders children correctly', () => {
    // 创建测试内容
    const testContent = <div data-testid="test-content">Test Content</div>;

    const { getByTestId } = render(<MainLayout>{testContent}</MainLayout>);

    // 验证子内容已正确渲染
    expect(getByTestId('test-content')).toBeInTheDocument();
    expect(getByTestId('test-content').textContent).toBe('Test Content');
  });

  it('has the correct base styles', () => {
    const { container } = render(
      <MainLayout>
        <div>Test</div>
      </MainLayout>,
    );

    // 获取最外层容器
    const mainContainer = container.firstChild;

    // 验证基础样式类
    expect(mainContainer).toHaveClass('min-h-screen');
    expect(mainContainer).toHaveClass('bg-dark-bg');
    expect(mainContainer).toHaveClass('text-white');
    expect(mainContainer).toHaveClass('relative');

    // 验证<main>元素
    const mainElement = container.querySelector('main');
    expect(mainElement).toBeInTheDocument();
    expect(mainElement).toHaveClass('relative');
  });
});
