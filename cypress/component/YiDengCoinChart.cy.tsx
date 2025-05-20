import React from 'react';
import { mount } from 'cypress/react18';
import YiDengCoinChart from '../../components/charts/YiDengCoinChart';
import { LanguageProvider } from '../../components/language/Context';

describe('YiDengCoinChart 组件', () => {
  beforeEach(() => {
    // 模拟fetch响应
    cy.intercept('https://api.geckoterminal.com/api/v2/networks/*/pools/*/ohlcv/*', {
      statusCode: 404,
      body: 'Not Found',
    }).as('fetchChartData');

    // 挂载组件
    cy.mount(
      <LanguageProvider initialLanguage="zh">
        <YiDengCoinChart />
      </LanguageProvider>,
    );
  });

  it('应该加载并显示图表', () => {
    // 等待图表容器加载
    cy.get('div[ref="chartContainerRef"]').should('exist');
    cy.wait('@fetchChartData');

    // 图表应该使用模拟数据呈现
    cy.get('canvas').should('be.visible');

    // 应该显示图表控件
    cy.get('button')
      .contains(/candle|line|volume/i)
      .should('exist');
  });

  it('应该允许切换图表时间周期', () => {
    // 等待API请求完成
    cy.wait('@fetchChartData');

    // 找到时间周期按钮
    cy.get('button').contains('1d').should('exist');
    cy.get('button').contains('4h').should('exist');

    // 点击时间周期按钮
    cy.get('button').contains('4h').click();

    // 应该触发新的API请求
    cy.wait('@fetchChartData');
  });

  it('应该允许切换图表类型', () => {
    // 等待API请求完成
    cy.wait('@fetchChartData');

    // 找到图表类型切换按钮
    cy.get('button')
      .contains(/candle|line|volume/i)
      .should('exist');

    // 点击切换图表类型
    cy.get('button')
      .contains(/candle|line|volume/i)
      .click();

    // 图表类型应该改变（通过按钮文本变化来验证）
    cy.get('button')
      .contains(/candle|line|volume/i)
      .should('not.contain', 'candle');
  });
});
