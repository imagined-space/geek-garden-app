import React from 'react';
import { mount } from 'cypress/react18';
import Orb from '../../components/effects/Orb';

describe('Orb 组件', () => {
  beforeEach(() => {
    // 模拟 WebGL 相关功能
    cy.window().then(win => {
      win.Worker = class MockWorker {
        constructor() {
          setTimeout(() => {
            this.onmessage({
              data: {
                type: 'particles',
                data: Array(20)
                  .fill(0)
                  .map(() => ({
                    size: Math.random() * 5 + 2,
                    distance: Math.random() * 50 + 10,
                    duration: Math.random() * 2 + 1,
                    opacity: Math.random() * 0.5 + 0.5,
                    delay: Math.random() * 0.5,
                    direction: Math.random() * 360,
                    color: Math.floor(Math.random() * 4),
                  })),
              },
            });

            this.onmessage({
              data: {
                type: 'hueAdjustment',
                data: {
                  colors: [
                    [0.611765, 0.262745, 0.996078],
                    [0.298039, 0.760784, 0.913725],
                    [0.062745, 0.078431, 0.6],
                  ],
                  hue: 0,
                },
              },
            });
          }, 100);
        }

        addEventListener(event, callback) {
          this.onmessage = callback;
        }

        postMessage() {}
        terminate() {}
      };

      // 模拟 Three.js
      win.THREE = {
        Scene: class {},
        PerspectiveCamera: class {},
        WebGLRenderer: class {
          setSize() {}
          setClearColor() {}
          render() {}
          get canvas() {
            return document.createElement('canvas');
          }
        },
        Triangle: class {},
        Mesh: class {
          setParent() {}
        },
        Program: class {
          remove() {}
        },
      };
    });

    // 挂载组件
    cy.mount(<Orb text="G" textColor="transparent" textSize="10rem" />);
  });

  it('应该渲染轨道组件', () => {
    // 检查容器和文本
    cy.get('div.w-full.h-full').should('exist');
    cy.get('.orb-center-text').should('contain', 'G');
    cy.get('canvas').should('exist');
  });

  it('应该响应鼠标悬停', () => {
    // 触发鼠标悬停
    cy.get('.orb-center-text').trigger('mouseenter');

    // 验证悬停状态
    cy.get('.orb-center-text').should('have.class', 'scale-125');

    // 悬停时的粒子效果
    cy.get('.orb-particles-container').should('exist');
    cy.get('.orb-particle').should('have.length.at.least', 1);

    // 触发鼠标离开
    cy.get('.orb-center-text').trigger('mouseleave');

    // 验证非悬停状态
    cy.get('.orb-center-text').should('have.class', 'scale-100');
  });

  it('应该接受自定义属性', () => {
    // 重新挂载组件并自定义属性
    cy.mount(
      <Orb
        text="X"
        textColor="red"
        textSize="20rem"
        hue={180}
        hoverIntensity={0.5}
        rotateOnHover={false}
        forceHoverState={true}
      />,
    );

    // 验证自定义文本
    cy.get('.orb-center-text').should('contain', 'X');

    // 验证自定义样式
    cy.get('.orb-center-text').should('have.css', 'font-size', '20rem');
    cy.get('.orb-center-text').should('have.css', 'color', 'red');

    // 由于forceHoverState=true，应该显示hover效果
    cy.get('.orb-particles-container').should('exist');
  });
});
