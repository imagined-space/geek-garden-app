import { defineConfig } from 'cypress';

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
    },
  },
  // 如果在本地遇到了跨域问题，可以添加以下设置
  chromeWebSecurity: false,
  // 设置较长的超时时间，因为 Web3 连接可能会较慢
  defaultCommandTimeout: 10000,
});
