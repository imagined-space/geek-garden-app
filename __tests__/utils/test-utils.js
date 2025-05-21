import React from 'react';
import { render } from '@testing-library/react';

// 创建一个测试包装器，避免使用 JSX 语法
function TestWrapper({ children }) {
  return React.createElement('div', {}, children);
}

// 自定义的渲染函数，使用 TestWrapper
const customRender = (ui, options) => render(ui, { wrapper: TestWrapper, ...options });

// 导出所有测试工具
export * from '@testing-library/react';
export { customRender as render };
