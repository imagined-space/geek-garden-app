import React from 'react';
import { mount } from 'cypress/react18';
import ParticlesBackground from '../../components/effects/ParticlesBackground';

describe('ParticlesBackground 组件', () => {
  beforeEach(() => {
    // 模拟 THREE.js 和 WebWorker
    cy.window().then(win => {
      // 简单的模拟
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
        Clock: class {
          getDelta() {
            return 0.016;
          }
        },
        Color: class {
          setHSL() {
            return this;
          }
          getHSL() {
            return { h: 0, s: 0, l: 0 };
          }
          setRGB() {
            return this;
          }
        },
        PlaneGeometry: class {},
        ShaderMaterial: class {
          dispose() {}
        },
        InstancedMesh: class {
          get frustumCulled() {
            return false;
          }
          set frustumCulled(v) {}
          get userData() {
            return {};
          }
        },
        Vector3: class {
          set() {}
        },
        InstancedBufferAttribute: class {},
        AdditiveBlending: 2,
        DoubleSide: 2,
      };

      // 模拟 Worker
      win.Worker = class {
        constructor() {
          setTimeout(() => {
            this.onmessage({
              data: {
                task: 'generateInitialData',
                result: {
                  initialPositions: new Float32Array(300),
                  scales: new Float32Array(100),
                  phases: new Float32Array(100),
                  speeds: new Float32Array(100),
                  opacities: new Float32Array(100),
                  vertexColors: new Float32Array(300),
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
    });

    // 挂载组件
    cy.mount(<ParticlesBackground density="normal" motionIntensity="normal" />);
  });

  it('应该渲染粒子背景容器', () => {
    // 验证容器存在
    cy.get('#particles-canvas').should('exist');

    // 验证位置样式
    cy.get('#particles-canvas').should('have.css', 'position', 'absolute');
    cy.get('#particles-canvas').should('have.css', 'z-index', '-1');
  });

  it('应该处理不同的密度配置', () => {
    // 重新挂载组件并设置高密度
    cy.mount(<ParticlesBackground density="high" motionIntensity="normal" />);

    // 验证高密度配置下仍能正常渲染
    cy.get('#particles-canvas').should('exist');

    // 重新挂载组件并设置低密度
    cy.mount(<ParticlesBackground density="low" motionIntensity="low" />);

    // 验证低密度配置下仍能正常渲染
    cy.get('#particles-canvas').should('exist');
  });

  it('应该应用颜色过渡效果', () => {
    // 重新挂载组件并自定义颜色
    cy.mount(
      <ParticlesBackground
        colorTransition={{
          baseHue: 0.5, // 使用蓝色调
          hueRange: 0.3,
          transitionSpeed: 2.0,
          colorStops: 5,
        }}
      />,
    );

    // 验证组件仍然正常渲染
    cy.get('#particles-canvas').should('exist');
  });

  it('应该响应可见性变化', () => {
    // 模拟页面可见性变化
    cy.window().then(win => {
      // 模拟页面隐藏
      Object.defineProperty(win.document, 'hidden', { value: true, writable: true });
      win.document.dispatchEvent(new Event('visibilitychange'));

      // 模拟页面再次可见
      Object.defineProperty(win.document, 'hidden', { value: false, writable: true });
      win.document.dispatchEvent(new Event('visibilitychange'));
    });

    // 验证组件仍然存在
    cy.get('#particles-canvas').should('exist');
  });
});
