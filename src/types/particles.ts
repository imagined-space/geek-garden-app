import * as THREE from 'three';
// ----------------- 类型定义 -----------------
interface ParticleSystemUserData {
  opacityArray: Float32Array;
  scaleArray: Float32Array;
  speedArray: Float32Array;
  phaseArray: Float32Array;
  initialPositions: Float32Array;
  time: number;
  rotationSpeed: number;
  waveSpeed: number;
  waveAmplitude: number;
  pulseFrequency: number; // 添加缺失的类型
  pulseAmplitude: number; // 添加缺失的类型
}

export interface ParticleGroup extends THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial> {
  userData: ParticleSystemUserData;
  geometry: THREE.BufferGeometry;
  material: THREE.PointsMaterial;
}

// ----------------- 颜色渐变配置 -----------------
// 自动颜色渐变控制
export interface ColorTransition {
  baseHue: number; // 基础色相 (0-1)
  hueRange: number; // 色相变化范围 (0-1)
  transitionSpeed: number; // 颜色变化速度
  colorStops: number; // 颜色停止点数量
}

// ----------------- 主组件 -----------------
export interface ParticlesBackgroundProps {
  density?: 'high' | 'normal' | 'low'; // 粒子密度
  motionIntensity?: 'high' | 'normal' | 'low'; // 运动强度
  colorTransition?: Partial<ColorTransition>; // 颜色变化配置
}

// Worker 消息类型定义
export interface WorkerMessage<T = any> {
  task: string;
  result: T;
  error?: string;
}

// 初始数据类型
export interface InitialParticleData {
  initialPositions: Float32Array;
  scales: Float32Array;
  phases: Float32Array;
  speeds: Float32Array;
  opacities: Float32Array;
  vertexColors: Float32Array;
}

// 更新数据类型
export interface AnimationUpdateData {
  time: number;
  colors: number[][];
}

// Worker 消息处理的通用类型
export type WorkerMessageHandler<T = any> = (e: MessageEvent<WorkerMessage<T>>) => void;


