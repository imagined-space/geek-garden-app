import React from 'react';
import { mount } from 'cypress/react18';
import ClickSpark from '../../components/ui/ClickSpark';

describe('ClickSpark 组件', () => {
  beforeEach(() => {
    // 挂载组件
    cy.mount(
      <ClickSpark sparkColor="#ff0000" sparkCount={8} duration={400}>
        <button className="test-button">Click me</button>
      </ClickSpark>,
    );
  });

  it('应该渲染子组件', () => {
    // 验证按钮正常渲染
    cy.get('.test-button').should('exist');
    cy.get('.test-button').should('contain', 'Click me');

    // 验证Canvas元素存在
    cy.get('canvas').should('exist');
  });

  it('应该响应点击事件', () => {
    // 获取Canvas元素
    cy.get('canvas').then($canvas => {
      // 保存当前画布内容
      const initialImageData = $canvas[0].toDataURL();

      // 点击按钮
      cy.get('.test-button').click();

      // Canvas应该更新（绘制火花效果）
      cy.wait(100); // 等待动画开始
      cy.get('canvas').then($newCanvas => {
        const newImageData = $newCanvas[0].toDataURL();
        // 比较画布内容是否有变化
        expect(newImageData).not.to.equal(initialImageData);
      });
    });
  });

  it('应该接受自定义属性', () => {
    // 重新挂载组件并自定义属性
    cy.mount(
      <ClickSpark
        sparkColor="#00ff00"
        sparkSize={20}
        sparkRadius={30}
        sparkCount={12}
        duration={800}
        easing="ease-in"
        extraScale={2.0}
      >
        <button className="test-button">Click me</button>
      </ClickSpark>,
    );

    // 验证按钮正常渲染
    cy.get('.test-button').should('exist');

    // 点击按钮触发动画
    cy.get('.test-button').click();

    // 验证Canvas元素存在并更新
    cy.get('canvas').should('exist');
  });
});
