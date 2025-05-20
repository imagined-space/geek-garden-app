import React from 'react';
import { mount } from 'cypress/react18';
import CountUp from '../../components/ui/CountUp';

describe('CountUp 组件', () => {
  it('应该从起始值计数到目标值', () => {
    // 挂载组件
    cy.mount(<CountUp from={0} to={100} duration={1} className="test-counter" />);

    // 刚开始应该显示接近起始值的数字
    cy.get('.test-counter').invoke('text').then(parseFloat).should('be.lessThan', 50);

    // 等待一段时间后，应该显示接近目标值的数字
    cy.wait(900);
    cy.get('.test-counter').invoke('text').then(parseFloat).should('be.greaterThan', 50);

    // 计数完成后，应该显示目标值
    cy.wait(200);
    cy.get('.test-counter').should('contain', '100');
  });

  it('应该支持向下计数', () => {
    // 挂载组件
    cy.mount(<CountUp from={100} to={0} duration={1} direction="down" className="test-counter" />);

    // 刚开始应该显示接近起始值的数字
    cy.get('.test-counter').invoke('text').then(parseFloat).should('be.greaterThan', 50);

    // 等待一段时间后，应该显示接近目标值的数字
    cy.wait(900);
    cy.get('.test-counter').invoke('text').then(parseFloat).should('be.lessThan', 50);

    // 计数完成后，应该显示目标值
    cy.wait(200);
    cy.get('.test-counter').should('contain', '0');
  });

  it('应该支持小数位和分隔符', () => {
    // 挂载组件
    cy.mount(
      <CountUp
        from={0}
        to={1234.56}
        duration={1}
        decimalPlaces={2}
        separator=","
        className="test-counter"
      />,
    );

    // 计数完成后，应该包含分隔符和小数位
    cy.wait(1100);
    cy.get('.test-counter').should('contain', '1,234.56');
  });

  it('应该支持回调函数', () => {
    // 创建 spy 函数
    const startSpy = cy.spy().as('startSpy');
    const endSpy = cy.spy().as('endSpy');

    // 挂载组件
    cy.mount(
      <CountUp
        from={0}
        to={100}
        duration={1}
        onStart={startSpy}
        onEnd={endSpy}
        className="test-counter"
      />,
    );

    // 开始回调应该立即被调用
    cy.get('@startSpy').should('have.been.called');

    // 结束回调应该在动画结束后被调用
    cy.wait(1100);
    cy.get('@endSpy').should('have.been.called');
  });

  it('应该支持条件启动', () => {
    // 挂载组件，但不立即启动
    cy.mount(<CountUp from={0} to={100} duration={1} startWhen={false} className="test-counter" />);

    // 应该显示起始值
    cy.get('.test-counter').should('contain', '0');

    // 等待一段时间后，仍然应该显示起始值
    cy.wait(1100);
    cy.get('.test-counter').should('contain', '0');

    // 重新挂载组件，这次启动计数
    cy.mount(<CountUp from={0} to={100} duration={1} startWhen={true} className="test-counter" />);

    // 计数完成后，应该显示目标值
    cy.wait(1100);
    cy.get('.test-counter').should('contain', '100');
  });
});
