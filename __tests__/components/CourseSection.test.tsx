import { render, screen } from '@testing-library/react';
import CourseSection from '@/components/courses/CourseSection';

// 模拟课程数据
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
    isPurchased: true,
    tokenId: 1,
  },
  {
    web2CourseId: 'course-3',
    name: 'DeFi Development',
    description: 'Build decentralized finance applications',
    price: 150,
    isPurchased: false,
    tokenId: 0,
  },
];

// 模拟 CourseCard 组件
jest.mock('@/components/courses/CourseCard', () => {
  return function MockCourseCard({ item }: any) {
    return (
      <div data-testid="course-card">
        <h3>{item.name}</h3>
        <p>{item.description}</p>
        <p>Price: G{item.price}</p>
        <p>Status: {item.isPurchased ? 'Purchased' : 'Not Purchased'}</p>
      </div>
    );
  };
});

describe('CourseSection Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // 模拟 jotai 状态
    jest.spyOn(require('jotai'), 'useAtom').mockImplementation(atom => {
      if (atom.name === 'coursesAtom') {
        return [mockCourses];
      }
      return [null, jest.fn()];
    });
  });

  it('renders the section title correctly', () => {
    render(<CourseSection />);

    // 验证标题
    expect(screen.getByText('courses.title')).toBeInTheDocument();
  });

  it('renders all course cards', () => {
    render(<CourseSection />);

    // 验证所有课程卡片都被渲染
    const courseCards = screen.getAllByTestId('course-card');
    expect(courseCards).toHaveLength(3);

    // 验证每个课程的信息
    expect(screen.getByText('Blockchain Basics')).toBeInTheDocument();
    expect(screen.getByText('Smart Contracts')).toBeInTheDocument();
    expect(screen.getByText('DeFi Development')).toBeInTheDocument();

    // 验证描述
    expect(screen.getByText('Introduction to blockchain technology')).toBeInTheDocument();
    expect(screen.getByText('Learn to develop smart contracts')).toBeInTheDocument();
    expect(screen.getByText('Build decentralized finance applications')).toBeInTheDocument();

    // 验证价格
    expect(screen.getByText('Price: G50')).toBeInTheDocument();
    expect(screen.getByText('Price: G100')).toBeInTheDocument();
    expect(screen.getByText('Price: G150')).toBeInTheDocument();

    // 验证购买状态
    expect(screen.getAllByText('Status: Not Purchased')).toHaveLength(2);
    expect(screen.getByText('Status: Purchased')).toBeInTheDocument();
  });

  it('renders no courses when the array is empty', () => {
    // 模拟空课程列表
    jest.spyOn(require('jotai'), 'useAtom').mockImplementation(atom => {
      if (atom.name === 'coursesAtom') {
        return [[]];
      }
      return [null, jest.fn()];
    });

    render(<CourseSection />);

    // 验证标题仍然存在
    expect(screen.getByText('courses.title')).toBeInTheDocument();

    // 验证没有课程卡片
    expect(screen.queryByTestId('course-card')).not.toBeInTheDocument();
  });
});
