import React from 'react';
import { mount } from 'cypress/react18';
import CourseSection from '../../components/courses/CourseSection';
import { LanguageProvider } from '../../components/language/Context';
import { JotaiProvider } from 'jotai';

// 模拟 jotai 原子状态
const mockCourses = [
  {
    web2CourseId: 'course-1',
    name: '区块链技术入门',
    description:
      '了解区块链的基本概念、工作原理以及为何它被认为是颠覆性技术。适合初学者的详细介绍。',
    price: 100,
    isPurchased: false,
  },
  {
    web2CourseId: 'course-2',
    name: '以太坊智能合约开发',
    description: '学习如何编写、测试和部署以太坊智能合约。包含实用代码示例和最佳实践。',
    price: 200,
    isPurchased: true,
  },
  {
    web2CourseId: 'course-3',
    name: 'DeFi 协议分析',
    description: '深入了解去中心化金融协议的工作原理、风险和机会。',
    price: 150,
    isPurchased: false,
  },
];

describe('CourseSection 组件', () => {
  beforeEach(() => {
    // 模拟 jotai 状态
    cy.window().then(win => {
      win.jotai = {
        useAtom: () => [mockCourses],
      };
    });

    // 挂载组件
    cy.mount(
      <JotaiProvider>
        <LanguageProvider initialLanguage="zh">
          <CourseSection />
        </LanguageProvider>
      </JotaiProvider>,
    );
  });

  it('应该渲染课程区块标题', () => {
    // 验证标题
    cy.get('h2.cyberpunk-title').should('exist');
  });

  it('应该渲染课程卡片', () => {
    // 验证课程卡片数量
    cy.get('.grid').children().should('have.length', mockCourses.length);

    // 验证第一个课程卡片内容
    cy.get('.grid')
      .children()
      .first()
      .within(() => {
        cy.get('h3').should('contain', mockCourses[0].name);
        cy.get('p').should('contain', mockCourses[0].description);
        cy.get('span').should('contain', `G${mockCourses[0].price}`);
      });

    // 验证已购买的课程状态
    cy.get('.grid')
      .children()
      .eq(1)
      .within(() => {
        cy.get('button').should('contain', 'purchased');
        cy.get('button').should('have.class', 'opacity-50');
      });
  });

  it('应该在卡片上显示购买按钮', () => {
    // 验证未购买课程的购买按钮
    cy.get('.grid')
      .children()
      .first()
      .within(() => {
        cy.get('button').should('contain', 'shop');
        cy.get('button').should('not.have.class', 'opacity-50');
      });

    // 验证已购买课程的购买按钮
    cy.get('.grid')
      .children()
      .eq(1)
      .within(() => {
        cy.get('button').should('contain', 'purchased');
        cy.get('button').should('have.class', 'opacity-50');
      });
  });
});
