import React from 'react';
import Header from '@/components/common/Header';
import CourseCard from '@/components/courses/CourseCard';
import Footer from '@/components/common/Footer';
import { LanguageProvider } from '@/components/language/Context';
import { Provider as JotaiProvider } from 'jotai/react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 创建一个测试用的wagmi配置
const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
});

// 创建React Query客户端
const queryClient = new QueryClient();

// Extend the Cypress AUTWindow interface
declare global {
  interface Window {
    useCourseContract: any;
  }
}

// 模拟课程数据
const mockCourse = {
  web2CourseId: 'course-1',
  name: '区块链技术入门',
  description: '了解区块链的基本概念、工作原理以及为何它被认为是颠覆性技术。适合初学者的详细介绍。',
  price: '100',
  isPurchased: false,
};

// 创建一个Provider包装器组件
const AllProviders = ({ children }: { children: React.ReactNode }) => (
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider theme={darkTheme()}>
        <JotaiProvider>
          <LanguageProvider initialLanguage="en">{children}</LanguageProvider>
        </JotaiProvider>
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

describe('无障碍性测试', () => {
  beforeEach(() => {
    // 设置 spy
    cy.window().then(win => {
      win.useCourseContract = cy.stub().returns({
        purchaseCourse: cy.stub().resolves(),
        getAllCourses: cy.stub().resolves(),
        isLoading: false,
      });
    });
  });

  it('Header 应该符合无障碍标准', () => {
    // 挂载 Header 组件，使用AllProviders包装
    cy.mount(
      <AllProviders>
        <Header />
      </AllProviders>,
    );

    // 检查导航链接
    cy.get('nav a').each($a => {
      // 链接应该有 href 属性
      cy.wrap($a).should('have.attr', 'href');
    });

    // 移动菜单按钮应该有 aria-label
    cy.viewport('iphone-x');
    cy.get('button[aria-label]').should('exist');
  });

  it('CourseCard 应该符合无障碍标准', () => {
    // 挂载 CourseCard 组件，使用AllProviders包装
    cy.mount(
      <AllProviders>
        <CourseCard item={mockCourse} />
      </AllProviders>,
    );

    // 检查标题层次结构
    cy.get('h3').should('exist');

    // 按钮应该可以通过键盘访问
    cy.get('button').should('not.have.attr', 'tabindex', '-1');

    // 验证价格信息有足够对比度
    cy.get('span')
      .contains(`G${mockCourse.price}`)
      .should('have.css', 'color')
      .and('not.eq', 'rgba(0, 0, 0, 0)');
  });

  it('Footer 应该符合无障碍标准', () => {
    // 挂载 Footer 组件，Footer可能不依赖这些Provider，但为了一致性也可以使用AllProviders
    cy.mount(
      <AllProviders>
        <Footer />
      </AllProviders>,
    );

    // 检查图标链接是否有适当的替代文本
    cy.get('footer a svg').each($svg => {
      cy.wrap($svg)
        .parent('a')
        .within(() => {
          cy.get('span.sr-only').should('exist');
        });
    });

    // 验证链接可以通过键盘访问
    cy.get('footer a').should('not.have.attr', 'tabindex', '-1');
  });
});
