import { defineConfig } from 'cypress';
import path from 'path';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // implement node event listeners here
      // 添加自定义任务
      on('task', {
        log(message) {
          console.log(message);
          return null; // 必须返回值
        },
      });
    },
  },
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
      // webpackConfig: {
      //   resolve: {
      //     '@/*': path.resolve(__dirname, 'src/*'),
      //   },
      //   module: {
      //     rules: [
      //       {
      //         test: /\.css$/,
      //         use: ['style-loader', 'css-loader'],
      //       },
      //     ],
      //   },
      // },
    },
    // 指定组件测试支持文件路径
    supportFile: 'cypress/support/component.ts',
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
    indexHtmlFile: 'cypress/support/component-index.html',
    // 设置视口大小
    // viewportWidth: 1280,
    // viewportHeight: 720,
  },
  // 如果在本地遇到了跨域问题，可以添加以下设置
  chromeWebSecurity: false,
  // 设置较长的超时时间，因为 Web3 连接可能会较慢
  defaultCommandTimeout: 10000,
});
