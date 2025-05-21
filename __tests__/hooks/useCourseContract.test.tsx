/**
 * 这是一个示例钩子函数测试文件
 * 在真实项目中，你应该替换为实际的钩子函数测试
 */

import { renderHook, act } from '@testing-library/react';

// 模拟合约相关的依赖
jest.mock('@ethersproject/contracts', () => ({
  Contract: jest.fn().mockImplementation(() => ({
    purchaseCourse: jest.fn().mockResolvedValue({ wait: jest.fn().mockResolvedValue(true) }),
    getAllCourses: jest.fn().mockResolvedValue([
      { id: 1, name: 'Course 1', price: 100, isPurchased: false },
      { id: 2, name: 'Course 2', price: 200, isPurchased: true },
    ]),
  })),
}));

// 模拟 Web3 钩子
jest.mock('@web3-react/core', () => ({
  useWeb3React: jest.fn().mockReturnValue({
    active: true,
    account: '0x123456789',
    library: {
      getSigner: jest.fn().mockReturnValue({
        getAddress: jest.fn().mockResolvedValue('0x123456789'),
      }),
    },
  }),
}));

// 假设的合约钩子
const useCourseContract = () => {
  const isLoading = false;

  const purchaseCourse = async (courseId: string) => {
    // 假设这里会调用合约方法
    return Promise.resolve(true);
  };

  const getAllCourses = async () => {
    // 假设这里会调用合约方法获取所有课程
    return Promise.resolve([
      { id: 1, name: 'Course 1', price: 100, isPurchased: false },
      { id: 2, name: 'Course 2', price: 200, isPurchased: true },
    ]);
  };

  return { purchaseCourse, getAllCourses, isLoading };
};

describe('useCourseContract Hook', () => {
  it('returns the expected functions and state', () => {
    const { result } = renderHook(() => useCourseContract());

    // 验证钩子返回的值
    expect(result.current).toHaveProperty('purchaseCourse');
    expect(result.current).toHaveProperty('getAllCourses');
    expect(result.current).toHaveProperty('isLoading');
    expect(typeof result.current.purchaseCourse).toBe('function');
    expect(typeof result.current.getAllCourses).toBe('function');
    expect(result.current.isLoading).toBe(false);
  });

  it('successfully purchases a course', async () => {
    const { result } = renderHook(() => useCourseContract());

    // 调用购买课程函数
    let purchaseResult;
    await act(async () => {
      purchaseResult = await result.current.purchaseCourse('course-1');
    });

    // 验证返回值
    expect(purchaseResult).toBe(true);
  });

  it('successfully gets all courses', async () => {
    const { result } = renderHook(() => useCourseContract());

    // 调用获取所有课程函数
    let courses;
    await act(async () => {
      courses = await result.current.getAllCourses();
    });

    // 验证返回的课程列表
    expect(courses).toHaveLength(2);
    expect(courses[0]).toHaveProperty('name', 'Course 1');
    expect(courses[0]).toHaveProperty('price', 100);
    expect(courses[0]).toHaveProperty('isPurchased', false);
    expect(courses[1]).toHaveProperty('name', 'Course 2');
    expect(courses[1]).toHaveProperty('isPurchased', true);
  });

  it('handles errors during course purchase', async () => {
    // 重写模拟实现，使其抛出错误
    const mockPurchaseCourse = jest.fn().mockRejectedValue(new Error('Transaction failed'));
    const useFailingCourseContract = () => ({
      ...useCourseContract(),
      purchaseCourse: mockPurchaseCourse,
    });

    const { result } = renderHook(() => useFailingCourseContract());

    // 调用购买课程函数，预期会抛出错误
    await expect(result.current.purchaseCourse('course-1')).rejects.toThrow('Transaction failed');
    expect(mockPurchaseCourse).toHaveBeenCalledWith('course-1');
  });

  it('handles wallet not connected scenario', async () => {
    // 重写模拟实现，使其返回未连接钱包的状态
    jest.spyOn(require('@web3-react/core'), 'useWeb3React').mockReturnValueOnce({
      active: false,
      account: null,
      library: null,
    });

    // 在这种情况下，我们可能会返回一个特定的错误信息或值
    const useWalletNotConnectedCourseContract = () => ({
      ...useCourseContract(),
      purchaseCourse: jest.fn().mockImplementation(() => {
        throw new Error('Wallet not connected');
      }),
    });

    const { result } = renderHook(() => useWalletNotConnectedCourseContract());

    // 调用购买课程函数，预期会抛出"钱包未连接"错误
    await expect(result.current.purchaseCourse('course-1')).rejects.toThrow('Wallet not connected');
  });
});
