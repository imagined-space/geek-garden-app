import React from 'react';
import { mount } from 'cypress/react18';
import CourseCard from '../../components/courses/CourseCard';
import { LanguageProvider } from '../../components/language/Context';
import { JotaiProvider } from 'jotai';

// 模拟课程数据
const mockCourse = {
  web2CourseId: 'course-1',
  name: '区块链技术入门',
  description: '了解区块链的基本概念、工作原理以及为何它被认为是颠覆性技术。适合初学者的详细介绍。',
  price: 100,
  isPurchased: false,
};

// 模拟已购买的课程数据
const mockPurchasedCourse = {
  ...mockCourse,
  isPurchased: true,
};

describe('CourseCard 组件', () => {
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

  it('应该正确渲染课程信息', () => {
    // 挂载组件
    cy.mount(
      <JotaiProvider>
        <LanguageProvider initialLanguage="zh">
          <CourseCard item={mockCourse} />
        </LanguageProvider>
      </JotaiProvider>,
    );

    // 检查课程信息
    cy.get('h3').should('contain', mockCourse.name);
    cy.get('p').should('contain', mockCourse.description);
    cy.get('span').should('contain', `G${mockCourse.price}`);
    cy.get('button').should('contain', 'shop');
    cy.get('button').should('not.be.disabled');
  });

  it('已购买的课程应该显示购买状态且按钮禁用', () => {
    // 挂载组件
    cy.mount(
      <JotaiProvider>
        <LanguageProvider initialLanguage="zh">
          <CourseCard item={mockPurchasedCourse} />
        </LanguageProvider>
      </JotaiProvider>,
    );

    // 检查购买状态
    cy.get('button').should('contain', 'purchased');
    cy.get('button').should('have.class', 'opacity-50');
    cy.get('button').should('have.class', 'cursor-not-allowed');
  });

  it('应该处理点击购买按钮事件', () => {
    // 挂载组件
    cy.mount(
      <JotaiProvider>
        <LanguageProvider initialLanguage="zh">
          <CourseCard item={mockCourse} />
        </LanguageProvider>
      </JotaiProvider>,
    );

    // 模拟购买函数
    cy.window().then(win => {
      win.handlePurchase = cy.spy();
    });

    // 点击购买按钮
    cy.get('button').click();

    // 验证购买函数调用
    cy.window().its('handlePurchase').should('be.called');
  });
});
