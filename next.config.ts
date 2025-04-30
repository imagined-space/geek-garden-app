import type { NextConfig } from "next";
import { resolve } from "path";
import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    turbo: {
      resolveAlias: {
        '@components': resolve('src/components'),
        '@hooks': resolve('src/hooks'),
        '@layouts': resolve('src/layouts'),
        '@assets': resolve('src/assets'),
        '@states': resolve('src/states'),
        '@service': resolve('src/service'),
        '@utils': resolve('src/utils'),
        '@lib': resolve('src/lib'),
        '@constants': resolve('src/constants'),
        '@connectors': resolve('src/connectors'),
        '@abis': resolve('src/abis'),
        '@types': resolve('src/types'),
        '@routes': resolve('src/routes'),
      }
    },
    // 添加更多实验性功能以提高性能
    optimizeCss: true, // 优化CSS输出
    scrollRestoration: true, // 改善滚动位置的恢复
  },
  
  // 增强图像优化
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // 改进的Webpack配置
  webpack: (config, { dev }) => {
    // 保留现有的SVG规则
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack']
    });
    
    // 针对生产环境的额外优化
    if (!dev) {
      // 优化THREE.js导入，减少包大小
      config.resolve.alias = {
        ...config.resolve.alias,
        'three/addons/': 'three/examples/jsm/',
      };
      
      // 减少动画和过渡效果的资源占用
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization?.splitChunks?.cacheGroups,
          animations: {
            test: /[\\/]node_modules[\\/](three|framer-motion)[\\/]/,
            name: 'animations',
            priority: 10,
            chunks: 'all',
          },
        },
      };
    }
    
    return config;
  },
  
  // 添加HTTP缓存策略以改善性能
  async headers() {
    return [
      {
        // 对静态资源应用长期缓存
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

(async () => {
  if (process.env.NODE_ENV === 'development') {
    await setupDevPlatform();
  }
})();

export default nextConfig;