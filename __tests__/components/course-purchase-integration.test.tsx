/**
 * 集成测试示例：课程购买流程
 * 这个测试用例演示了如何测试跨多个组件的用户流程
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { toast } from 'sonner';
import CourseSection from '@/components/courses/CourseSection';

// 模拟 jotai 状态管理
jest.mock('jotai', () => {
  const originalModule = jest.requireActual('jotai');
  const courseStore = {
    courses: [
      {
        web2CourseId: 'course-1',
        name: 'Blockchain Basics',
        description: 'Introduction to blockchain technology',
        price: 50,
        isPurchased: false,
        tokenId: 0,
      },
      {
        web2CourseId: 'course-2',
        name: 'Smart Contracts',
        description: 'Learn to develop smart contracts',
        price: 100,
        isPurchased: false,
        tokenId: 0,
      },
    ],
    purchaseCourseAction: jest.fn(),
    updateCourseAction: jest.fn(),
  };

  return {
    ...originalModule,
    useAtom: jest.fn(atom => {
      if (atom.name === 'coursesAtom') {
        return [courseStore.courses];
      }
      if (atom.name === 'purchaseCourseAction') {
        return [null, courseStore.purchaseCourseAction];
      }
      if (atom.name === 'updateCourseAction') {
        return [null, courseStore.updateCourseAction];
      }
      return [null, jest.fn()];
    }),
  };
});

// 模拟 useCourseContract 钩子
jest.mock('@/hooks/useCourseContract', () => ({
  useCourseContract: () => ({
    purchaseCourse: jest.fn().mockResolvedValue(true),
    getAllCourses: jest.fn(),
    isLoading: false,
  }),
}));

// 模拟 web3 连接
jest.mock('@web3-react/core', () => ({
  useWeb3React: jest.fn().mockReturnValue({
    active: true,
    account: '0x123456789',
  }),
}));

// 创建测试用的包装器组件
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

describe('Course Purchase Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('allows a user to view and purchase a course', async () => {
    // 渲染课程区域
    render(<CourseSection />, { wrapper: TestWrapper });

    // 验证课程列表显示
    expect(screen.getByText('courses.title')).toBeInTheDocument();

    // 等待课程卡片加载
    const courseCards = await screen.findAllByTestId('course-card');
    expect(courseCards.length).toBeGreaterThan(0);

    // 找到"Blockchain Basics"课程并点击购买按钮
    const purchaseButton = screen.getAllByText('shop')[0];
    fireEvent.click(purchaseButton);

    // 验证购买流程被触发
    await waitFor(() => {
      // 验证调用了正确的状态更新函数
      expect(
        require('jotai').useAtom.mock.results.some(
          res =>
            res.value[1] ===
            require('jotai').useAtom.mock.calls.find(
              call => call[0].name === 'purchaseCourseAction',
            )[0].name,
        ),
      ).toBe(true);

      // 验证显示成功提示
      expect(toast.success).toHaveBeenCalledWith('shop success');
    });
  });

  it('handles network errors when purchasing a course', async () => {
    // 重写模拟实现，使购买操作失败
    jest.spyOn(require('@/hooks/useCourseContract'), 'useCourseContract').mockReturnValue({
      purchaseCourse: jest.fn().mockRejectedValue(new Error('Network error')),
      getAllCourses: jest.fn(),
      isLoading: false,
    });

    // 渲染课程区域
    render(<CourseSection />, { wrapper: TestWrapper });

    // 找到课程并点击购买按钮
    const purchaseButton = screen.getAllByText('shop')[0];
    fireEvent.click(purchaseButton);

    // 验证错误处理
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('shop failed');
    });
  });

  it('disables purchase buttons when wallet is not connected', async () => {
    // 重写模拟实现，返回未连接的钱包状态
    jest.spyOn(require('@web3-react/core'), 'useWeb3React').mockReturnValue({
      active: false,
      account: null,
    });

    // 重写 useCourseContract 模拟
    jest.spyOn(require('@/hooks/useCourseContract'), 'useCourseContract').mockReturnValue({
      purchaseCourse: jest.fn(),
      getAllCourses: jest.fn(),
      isLoading: true, // 设置为加载状态，这通常在钱包未连接时会发生
    });

    // 渲染课程区域
    render(<CourseSection />, { wrapper: TestWrapper });

    // 找到购买按钮，应该被禁用
    const purchaseButtons = screen.getAllByText('shop');
    purchaseButtons.forEach(button => {
      expect(button.closest('button')).toBeDisabled();
    });
  });
});
