import React from 'react';
import { mount } from 'cypress/react18';
import MainLayout from '../../components/common/MainLayout';

describe('MainLayout 组件', () => {
  it('应该渲染子组件', () => {
    // 挂载组件
    cy.mount(
      <MainLayout>
        <div className="test-content">Test Content</div>
      </MainLayout>,
    );

    // 验证子组件被渲染
    cy.get('.test-content').should('exist');
    cy.get('.test-content').should('contain', 'Test Content');
  });

  it('应该应用基本布局样式', () => {
    // 挂载组件
    cy.mount(
      <MainLayout>
        <div className="test-content">Test Content</div>
      </MainLayout>,
    );

    // 验证基本布局容器
    cy.get('.min-h-screen').should('exist');
    cy.get('.bg-dark-bg').should('exist');
    cy.get('.text-white').should('exist');
    cy.get('main').should('exist');
  });

  it('应该保持相对定位', () => {
    // 挂载组件
    cy.mount(
      <MainLayout>
        <div className="test-content">Test Content</div>
      </MainLayout>,
    );

    // 验证相对定位
    cy.get('.relative').should('exist');
  });
});
