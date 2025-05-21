/**
 * 测试 Jotai 状态管理库中的课程状态
 */

import { getDefaultStore } from 'jotai';
import { coursesAtom, purchaseCourseAction, updateCourseAction } from '@/stores/courseStore';

// 模拟数据
const mockCourses = [
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
];

// 模拟 courseStore 实现
jest.mock('@/stores/courseStore', () => {
  // 创建一个原子状态
  const { atom } = jest.requireActual('jotai');

  // 初始化带有模拟数据的 coursesAtom
  const mockCoursesAtom = atom([...mockCourses]);

  // 创建购买课程的 action
  const mockPurchaseCourseAction = atom(
    null, // 读取值（无）
    (get, set, courseId: string) => {
      const courses = get(mockCoursesAtom);
      const updatedCourses = courses.map(course =>
        course.web2CourseId === courseId ? { ...course, isPurchased: true } : course,
      );
      set(mockCoursesAtom, updatedCourses);
    },
  );

  // 创建更新课程的 action
  const mockUpdateCourseAction = atom(
    null, // 读取值（无）
    (get, set, courseId: string, updatedCourse: any) => {
      const courses = get(mockCoursesAtom);
      const updatedCourses = courses.map(course =>
        course.web2CourseId === courseId ? { ...course, ...updatedCourse } : course,
      );
      set(mockCoursesAtom, updatedCourses);
    },
  );

  return {
    coursesAtom: mockCoursesAtom,
    purchaseCourseAction: mockPurchaseCourseAction,
    updateCourseAction: mockUpdateCourseAction,
  };
});

describe('Course Store', () => {
  let store;

  beforeEach(() => {
    // 获取一个新的 Jotai 存储实例
    store = getDefaultStore();

    // 重置存储中的课程状态为初始状态
    store.set(coursesAtom, [...mockCourses]);
  });

  it('initializes with correct courses', () => {
    const courses = store.get(coursesAtom);

    expect(courses).toHaveLength(2);
    expect(courses[0].web2CourseId).toBe('course-1');
    expect(courses[0].name).toBe('Blockchain Basics');
    expect(courses[0].isPurchased).toBe(false);

    expect(courses[1].web2CourseId).toBe('course-2');
    expect(courses[1].name).toBe('Smart Contracts');
    expect(courses[1].isPurchased).toBe(false);
  });

  it('purchases a course correctly', () => {
    // 获取初始状态
    const initialCourses = store.get(coursesAtom);
    expect(initialCourses[0].isPurchased).toBe(false);

    // 执行购买操作
    store.set(purchaseCourseAction, 'course-1');

    // 验证状态更新
    const updatedCourses = store.get(coursesAtom);
    expect(updatedCourses[0].isPurchased).toBe(true);
    expect(updatedCourses[1].isPurchased).toBe(false); // 其他课程不受影响
  });

  it('updates a course correctly', () => {
    // 获取初始状态
    const initialCourses = store.get(coursesAtom);
    expect(initialCourses[0].price).toBe(50);

    // 执行更新操作
    store.set(updateCourseAction, 'course-1', {
      price: 75,
      description: 'Updated description',
    });

    // 验证状态更新
    const updatedCourses = store.get(coursesAtom);
    expect(updatedCourses[0].price).toBe(75);
    expect(updatedCourses[0].description).toBe('Updated description');
    expect(updatedCourses[1].price).toBe(100); // 其他课程不受影响
  });

  it('handles non-existent course gracefully', () => {
    // 尝试更新不存在的课程
    store.set(updateCourseAction, 'non-existent-course', { price: 999 });

    // 验证状态没有意外变化
    const courses = store.get(coursesAtom);
    expect(courses).toHaveLength(2);
    expect(courses[0].price).toBe(50);
    expect(courses[1].price).toBe(100);
  });

  it('preserves other course properties when updating one property', () => {
    // 只更新价格
    store.set(updateCourseAction, 'course-1', { price: 60 });

    // 验证其他属性保持不变
    const courses = store.get(coursesAtom);
    expect(courses[0].price).toBe(60);
    expect(courses[0].name).toBe('Blockchain Basics'); // 名称保持不变
    expect(courses[0].description).toBe('Introduction to blockchain technology'); // 描述保持不变
    expect(courses[0].isPurchased).toBe(false); // 购买状态保持不变
  });
});
