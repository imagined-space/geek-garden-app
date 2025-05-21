import { render, screen, fireEvent } from '@testing-library/react';
import { toast } from 'sonner';
import CourseCard from '@/components/courses/CourseCard';

// 模拟数据
const mockCourse = {
  web2CourseId: 'course-123',
  name: 'Web3 Basic Course',
  description: 'Learn the fundamentals of Web3 technology',
  price: 100,
  isPurchased: false,
  tokenId: 0,
};

describe('CourseCard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders course information correctly', () => {
    render(<CourseCard item={mockCourse} />);

    // 验证课程名称和描述
    expect(screen.getByText('Web3 Basic Course')).toBeInTheDocument();
    expect(screen.getByText('Learn the fundamentals of Web3 technology')).toBeInTheDocument();

    // 验证价格
    expect(screen.getByText('G100')).toBeInTheDocument();

    // 验证购买按钮
    expect(screen.getByText('shop')).toBeInTheDocument();
  });

  it('handles course purchase success', async () => {
    // 模拟重写 atom 以捕获 purchaseCourseAction 调用
    const purchaseCourseWeb2 = jest.fn();
    const updateCourse = jest.fn();
    jest.spyOn(require('jotai'), 'useAtom').mockImplementation(atom => {
      if (atom.name === 'purchaseCourseAction') {
        return [null, purchaseCourseWeb2];
      }
      if (atom.name === 'updateCourseAction') {
        return [null, updateCourse];
      }
      return [null, jest.fn()];
    });

    // 模拟 useCourseContract 返回
    jest.spyOn(require('@/hooks/useCourseContract'), 'useCourseContract').mockReturnValue({
      purchaseCourse: jest.fn().mockResolvedValue(true),
      getAllCourses: jest.fn(),
      isLoading: false,
    });

    render(<CourseCard item={mockCourse} />);

    // 点击购买按钮
    const purchaseButton = screen.getByText('shop');
    fireEvent.click(purchaseButton);

    // 验证调用了正确的函数
    expect(purchaseCourseWeb2).toHaveBeenCalledWith('course-123');

    // 验证显示成功提示
    expect(toast.success).toHaveBeenCalledWith('shop success');
  });

  it('handles course purchase failure', async () => {
    // 模拟重写 atom 以捕获 purchaseCourseAction 调用
    const purchaseCourseWeb2 = jest.fn();
    const updateCourse = jest.fn();
    jest.spyOn(require('jotai'), 'useAtom').mockImplementation(atom => {
      if (atom.name === 'purchaseCourseAction') {
        return [null, purchaseCourseWeb2];
      }
      if (atom.name === 'updateCourseAction') {
        return [null, updateCourse];
      }
      return [null, jest.fn()];
    });

    // 模拟 useCourseContract 返回失败
    jest.spyOn(require('@/hooks/useCourseContract'), 'useCourseContract').mockReturnValue({
      purchaseCourse: jest.fn().mockRejectedValue(new Error('Transaction failed')),
      getAllCourses: jest.fn(),
      isLoading: false,
    });

    render(<CourseCard item={mockCourse} />);

    // 点击购买按钮
    const purchaseButton = screen.getByText('shop');
    fireEvent.click(purchaseButton);

    // 验证调用了正确的函数
    expect(purchaseCourseWeb2).toHaveBeenCalledWith('course-123');

    // 异步等待错误处理
    await new Promise(resolve => setTimeout(resolve, 0));

    // 验证显示错误提示
    expect(toast.error).toHaveBeenCalledWith('shop failed');

    // 验证回滚操作
    expect(updateCourse).toHaveBeenCalledWith('course-123', { ...mockCourse, isPurchased: false });
  });

  it('disables the purchase button for already purchased courses', () => {
    // 创建一个已购买的课程
    const purchasedCourse = { ...mockCourse, isPurchased: true };

    render(<CourseCard item={purchasedCourse} />);

    // 验证按钮显示"已购买"
    expect(screen.getByText('purchased')).toBeInTheDocument();

    // 验证按钮被禁用
    const purchaseButton = screen.getByText('purchased');
    expect(purchaseButton.closest('button')).toBeDisabled();
    expect(purchaseButton.closest('button')).toHaveClass('opacity-50');
    expect(purchaseButton.closest('button')).toHaveClass('cursor-not-allowed');
  });

  it('disables the purchase button when loading', () => {
    // 模拟加载状态
    jest.spyOn(require('@/hooks/useCourseContract'), 'useCourseContract').mockReturnValue({
      purchaseCourse: jest.fn(),
      getAllCourses: jest.fn(),
      isLoading: true,
    });

    render(<CourseCard item={mockCourse} />);

    // 验证按钮仍显示"购买"
    expect(screen.getByText('shop')).toBeInTheDocument();

    // 验证按钮被禁用
    const purchaseButton = screen.getByText('shop');
    expect(purchaseButton.closest('button')).toBeDisabled();
  });
});
