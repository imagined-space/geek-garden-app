import { ColorTransition } from '@/types/particles';

// ----------------- 配置对象 -----------------
// 性能配置对象
export const PERFORMANCE_CONFIG = {
  high: {
    particleCount1: 2500,
    particleCount2: 1500,
    particleCount3: 800,
    particleCount4: 300,
    updateFraction: 1.0,
    usePostProcessing: true,
    targetFPS: 60,
  },
  medium: {
    particleCount1: 1200,
    particleCount2: 800,
    particleCount3: 400,
    particleCount4: 150,
    updateFraction: 0.7,
    usePostProcessing: false,
    targetFPS: 45,
  },
  low: {
    particleCount1: 600,
    particleCount2: 300,
    particleCount3: 150,
    particleCount4: 60,
    updateFraction: 0.4,
    usePostProcessing: false,
    targetFPS: 30,
  },
};

// 预设的粒子组配置
export const PARTICLE_GROUP_PRESETS = [
  // 核心密集粒子 - 光芒效果
  {
    name: 'core',
    size: 0.018,
    range: 6,
    color: 0x05d9e8,
    minOpacity: 0.6,
    maxOpacity: 0.9,
    rotationSpeed: 0.12,
    waveSpeed: 0.01,
    waveAmplitude: 0.6,
    textureKey: 'glow',
    pulseFrequency: 0.2,
    pulseAmplitude: 0.18,
  },
  // 中距离粒子 - 星星效果
  {
    name: 'stars',
    size: 0.035,
    range: 10,
    color: 0xff2a6d,
    minOpacity: 0.4,
    maxOpacity: 0.8,
    rotationSpeed: 0.001,
    waveSpeed: 0.002,
    waveAmplitude: 0.8,
    textureKey: 'star',
    pulseFrequency: 0.3,
    pulseAmplitude: 0.15,
  },
  // 远距离大型粒子 - 烟雾效果
  {
    name: 'fog',
    size: 0.06,
    range: 16,
    color: 0xd300c5,
    minOpacity: 0.2,
    maxOpacity: 0.6,
    rotationSpeed: 0.0004,
    waveSpeed: 0.003,
    waveAmplitude: 1.2,
    textureKey: 'smoke',
    pulseFrequency: 0.15,
    pulseAmplitude: 0.2,
  },
  // 稀疏闪烁粒子 - 闪光效果
  {
    name: 'sparkles',
    size: 0.08,
    range: 22,
    color: 0x39ff14,
    minOpacity: 0.1,
    maxOpacity: 1.0,
    rotationSpeed: 0.002,
    waveSpeed: 0.004,
    waveAmplitude: 1.3,
    textureKey: 'sparkle',
    pulseFrequency: 0.5,
    pulseAmplitude: 0.25,
  },
];

// 纹理路径配置
export const TEXTURE_PATHS = {
  glow: '/textures/glow.png',
  star: '/textures/star.png',
  smoke: '/textures/smoke.png',
  sparkle: '/textures/sparkle.png',
};

// ----------------- 颜色渐变配置 -----------------
// 默认颜色渐变配置
export const DEFAULT_COLOR_TRANSITION: ColorTransition = {
  baseHue: 0.6, // 开始于蓝色
  hueRange: 1.0, // 完整色相环
  transitionSpeed: 0.05, // 适中的变化速度
  colorStops: 4, // 四个颜色点
};

