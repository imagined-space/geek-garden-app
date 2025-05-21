import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // 测试匹配模式 - 更新为使用集中的测试文件夹
  testMatch: ['<rootDir>/__tests__/**/*.{js,jsx,ts,tsx}'],
  // 模块名称映射，帮助简化导入路径
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@layouts/(.*)$': '<rootDir>/src/layouts/$1',
    '^@states/(.*)$': '<rootDir>/src/states/$1',
    '^@service/(.*)$': '<rootDir>/src/service/$1',
    '^@constants/(.*)$': '<rootDir>/src/constants/$1',
    '^@abis/(.*)$': '<rootDir>/src/abis/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    // 处理样式和资源文件
    '^.+\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^.+\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
    // 添加 lightweight-charts 模块映射
    '^lightweight-charts$': '<rootDir>/__mocks__/lightweightChartsMock.js',
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      isolatedModules: true,
    },
  },
  transformIgnorePatterns: ['/node_modules/(?!(ogl|wagmi|three|@rainbow-me|lightweight-charts)/)'],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);
