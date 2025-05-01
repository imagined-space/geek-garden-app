'use client';

import React, { useEffect, useRef, memo, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import {
  ParticlesBackgroundProps,
  WorkerMessageHandler,
  InitialParticleData,
  AnimationUpdateData,
} from '@/types/particles';
import { createParticleWorker } from '@/utils/particles-worker';
import { PERFORMANCE_CONFIG, PARTICLE_GROUP_PRESETS, DEFAULT_COLOR_TRANSITION } from './constants';
import { detectPerformanceLevel } from './usePerformance';
import { loadTextures } from './textureLoader';

// ----------------- 单例控制器 -----------------
let sceneInstance: THREE.Scene | null = null;
let cameraInstance: THREE.PerspectiveCamera | null = null;
let rendererInstance: THREE.WebGLRenderer | null = null;
let instancedMeshGroups: THREE.InstancedMesh[] = [];
let loadedTextures: Record<string, THREE.Texture> = {};
let isInitialized = false;
let animationFrameId: number | null = null;
let worker: Worker | null = null;

// 顶点着色器
const vertexShader = `
  attribute vec3 initialPosition;
  attribute float scale;
  attribute float phase;
  attribute float speed;
  attribute float opacity;
  attribute vec3 vertexColor;
  
  uniform float time;
  uniform float pulseFactor;
  uniform float waveAmplitude;
  uniform float waveSpeed;
  uniform vec3 focalPoint;
  uniform vec3 globalMotion;
  
  varying float vOpacity;
  varying vec3 vColor;
  varying vec2 vUv;
  
  void main() {
    // 传递纹理坐标
    vUv = uv;
    
    // 复制顶点属性到变量
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    
    // 计算原始位置在模型空间中
    vec3 orgPos = initialPosition;
    
    // 计算到焦点的距离
    vec3 toFocal = orgPos - focalPoint;
    float distance = length(toFocal);
    float distanceFactor = 1.0 / (1.0 + distance * 0.1);
    
    // 波动效果
    float particleTime = time * waveSpeed + phase;
    float xWave = sin(particleTime + orgPos.x) * waveAmplitude;
    float yWave = cos(particleTime * 0.8 + orgPos.y * 2.0) * waveAmplitude;
    float zWave = sin(particleTime * 1.2 + orgPos.z * 1.5) * waveAmplitude;
    
    // 全局波动
    float i = float(gl_InstanceID);
    float globalFactor = 0.01;
    float globalX = sin(time * 0.0001 + i * globalFactor) * globalMotion.x;
    float globalY = cos(time * 0.00013 + i * globalFactor) * globalMotion.y;
    float globalZ = sin(time * 0.00007 + i * globalFactor) * globalMotion.z;
    
    // 计算新位置
    vec3 newPos = orgPos;
    newPos.x += xWave * pulseFactor + globalX - toFocal.x * distanceFactor * 0.03;
    newPos.y += yWave * pulseFactor + globalY - toFocal.y * distanceFactor * 0.03;
    newPos.z += zWave * pulseFactor + globalZ - toFocal.z * distanceFactor * 0.03;
    
    // 将当前顶点位置设置为新位置
    mvPosition = modelViewMatrix * vec4(newPos, 1.0);
    
    // 缩放粒子
    float scaleFactor = scale * (1.0 + sin(time * 0.5) * 0.1);
    mvPosition.xyz += position * scaleFactor;
    
    // 计算最终位置
    gl_Position = projectionMatrix * mvPosition;
    
    // 传递不透明度到片段着色器
    vOpacity = opacity * (0.6 + sin(time * 0.5) * 0.2);
    
    // 传递顶点颜色
    vColor = vertexColor;
  }
`;

// 片段着色器
const fragmentShader = `
  uniform sampler2D map;
  uniform vec3 baseColor;
  
  varying float vOpacity;
  varying vec3 vColor;
  varying vec2 vUv;
  
  void main() {
    // 获取纹理颜色
    vec4 texColor = texture2D(map, vUv);
    
    // 混合实例颜色和基础颜色
    vec3 color = vColor * baseColor;
    
    // 设置最终颜色
    gl_FragColor = vec4(color, vOpacity * texColor.a);
  }
`;

// ----------------- 主组件 -----------------
const ParticlesBackground: React.FC<ParticlesBackgroundProps> = memo(
  ({ density = 'normal', motionIntensity = 'normal', colorTransition }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // 使用 useMemo 来避免在每次渲染时重新创建 colorConfig 对象
    const colorConfig = useMemo(
      () => ({
        ...DEFAULT_COLOR_TRANSITION,
        ...colorTransition,
      }),
      [colorTransition],
    );

    // 使用 useCallback 避免在每次渲染时重新创建函数
    const getDensityMultiplier = useCallback(() => {
      switch (density) {
        case 'high':
          return 1.5;
        case 'normal':
          return 1.0;
        case 'low':
          return 0.6;
        default:
          return 1.0;
      }
    }, [density]);

    // 使用 useCallback 避免在每次渲染时重新创建函数
    const getMotionParams = useCallback(() => {
      switch (motionIntensity) {
        case 'high':
          return {
            waveMultiplier: 1.5,
            rotationMultiplier: 1.4,
            pulseMultiplier: 1.3,
          };
        case 'normal':
          return {
            waveMultiplier: 1.0,
            rotationMultiplier: 1.0,
            pulseMultiplier: 1.0,
          };
        case 'low':
          return {
            waveMultiplier: 0.6,
            rotationMultiplier: 0.7,
            pulseMultiplier: 0.8,
          };
        default:
          return {
            waveMultiplier: 1.0,
            rotationMultiplier: 1.0,
            pulseMultiplier: 1.0,
          };
      }
    }, [motionIntensity]);

    // 创建粒子组函数 - 使用 InstancedMesh
    function createInstancedMeshGroup(
      count: number,
      range: number,
      size: number,
      color: THREE.Color,
      minOpacity: number,
      maxOpacity: number,
      rotationSpeed: number,
      waveSpeed: number,
      waveAmplitude: number,
      textureKey: string,
      pulseFrequency: number,
      pulseAmplitude: number,
    ): Promise<void> {
      return new Promise(resolve => {
        if (!sceneInstance || !worker) {
          resolve();
          return;
        }

        // 创建几何体 - 使用平面几何体
        const geometry = new THREE.PlaneGeometry(size, size);

        // 使用 Worker 生成初始数据
        const hsl = { h: 0, s: 0, l: 0 };
        color.getHSL(hsl);

        worker.postMessage({
          task: 'generateInitialData',
          data: {
            count,
            range,
            minOpacity,
            maxOpacity,
            color: hsl,
          },
        });

        // 监听 Worker 返回的数据
        const workerHandler: WorkerMessageHandler<InitialParticleData> = e => {
          const { task, result } = e.data;

          if (task === 'generateInitialData') {
            const { initialPositions, scales, phases, speeds, opacities, vertexColors } = result;

            // 添加自定义属性到几何体
            geometry.setAttribute(
              'initialPosition',
              new THREE.InstancedBufferAttribute(initialPositions, 3),
            );
            geometry.setAttribute('scale', new THREE.InstancedBufferAttribute(scales, 1));
            geometry.setAttribute('phase', new THREE.InstancedBufferAttribute(phases, 1));
            geometry.setAttribute('speed', new THREE.InstancedBufferAttribute(speeds, 1));
            geometry.setAttribute('opacity', new THREE.InstancedBufferAttribute(opacities, 1));
            geometry.setAttribute(
              'vertexColor',
              new THREE.InstancedBufferAttribute(vertexColors, 3),
            );

            // 创建自定义 shader 材质
            const material = new THREE.ShaderMaterial({
              uniforms: {
                map: { value: loadedTextures[textureKey] },
                time: { value: Math.random() * 1000 },
                pulseFactor: { value: 1.0 },
                waveAmplitude: { value: waveAmplitude },
                waveSpeed: { value: waveSpeed },
                focalPoint: { value: new THREE.Vector3(0, 0, 0) },
                globalMotion: { value: new THREE.Vector3(0.5, 0.5, 0.5) },
                baseColor: { value: color },
              },
              vertexShader,
              fragmentShader,
              transparent: true,
              blending: THREE.AdditiveBlending,
              depthWrite: false,
              side: THREE.DoubleSide,
            });

            // 创建 InstancedMesh
            const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
            instancedMesh.frustumCulled = false; // 禁用视锥体剔除

            // 添加到场景
            sceneInstance?.add(instancedMesh);
            instancedMeshGroups.push(instancedMesh);

            // 保存额外数据
            instancedMesh.userData = {
              time: Math.random() * 1000,
              rotationSpeed,
              pulseFrequency,
              pulseAmplitude,
            };

            // 移除临时事件监听
            worker?.removeEventListener('message', workerHandler);

            // 完成创建
            resolve();
          }
        };

        worker.addEventListener('message', workerHandler);
      });
    }

    // 更新粒子组函数 - 使用 Shader
    function updateShaderParticles(
      instancedMesh: THREE.InstancedMesh,
      delta: number,
      focalPoint: { x: number; y: number; z: number },
      globalMotion: { time: number; amplitude: number },
    ): void {
      const material = instancedMesh.material as THREE.ShaderMaterial;
      const {userData} = instancedMesh;

      // 更新时间
      userData.time += delta;

      // 更新 shader uniforms
      material.uniforms.time.value = userData.time;
      material.uniforms.focalPoint.value.set(focalPoint.x, focalPoint.y, focalPoint.z);
      material.uniforms.globalMotion.value.set(
        Math.sin(globalMotion.time) * globalMotion.amplitude,
        Math.cos(globalMotion.time * 1.3) * globalMotion.amplitude,
        Math.sin(globalMotion.time * 0.7) * globalMotion.amplitude,
      );

      // 脉动效果
      material.uniforms.pulseFactor.value =
        Math.sin(userData.time * userData.pulseFrequency) * userData.pulseAmplitude + 1.0;

      // 旋转整个网格 (虽然大部分动画效果都在 shader 中，但整体旋转仍然有用)
      instancedMesh.rotation.x += userData.rotationSpeed * delta;
      instancedMesh.rotation.y += userData.rotationSpeed * delta * 1.5;
      instancedMesh.rotation.z += userData.rotationSpeed * delta * 0.5;
    }

    // 清理资源函数
    function cleanupResources(): void {
      // 清理场景
      if (sceneInstance && instancedMeshGroups.length > 0) {
        instancedMeshGroups.forEach(mesh => {
          sceneInstance?.remove(mesh);
          mesh.geometry.dispose();

          if (mesh.material instanceof THREE.Material) {
            mesh.material.dispose();
          }
        });

        instancedMeshGroups = [];
      }

      // 清理纹理
      Object.values(loadedTextures).forEach(texture => {
        texture.dispose();
      });

      // 清理渲染器
      if (rendererInstance) {
        rendererInstance.dispose();
        rendererInstance = null;
      }

      // 清理相机和场景
      cameraInstance = null;
      sceneInstance = null;

      // 终止 Worker
      if (worker) {
        worker.terminate();
        worker = null;
      }
    }

    useEffect(() => {
      // 如果已经初始化，不再重复创建
      if (isInitialized || !mountRef.current) {
        return undefined;
      }

      // 初始化标志
      let localIsInitialized = false;
      let isMounted = true; // 添加挂载标志以跟踪组件挂载状态
      let clock: THREE.Clock;
      let lastTime = 0;

      // 检测设备性能
      const performanceLevel = detectPerformanceLevel();
      const config = PERFORMANCE_CONFIG[performanceLevel];

      // 获取配置参数
      const densityMultiplier = getDensityMultiplier();
      const motionParams = getMotionParams();

      // 颜色渐变控制器
      const colorController = {
        baseHue: colorConfig.baseHue,
        hueRange: colorConfig.hueRange,
        transitionSpeed: colorConfig.transitionSpeed,
        colorStops: colorConfig.colorStops,
        currentTime: 0,
      };

      // 异步初始化系统
      const initParticleSystem = async () => {
        try {
          // 创建 Worker - 使用安全的工厂函数
          worker = createParticleWorker();

          // 如果 Worker 创建失败，回退到非 Worker 模式
          if (!worker) {
            console.warn('WebWorker 创建失败，回退到主线程模式');
          }

          // 加载纹理
          loadedTextures = await loadTextures();

          // 创建场景
          const scene = new THREE.Scene();
          sceneInstance = scene;

          // 创建相机
          const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000,
          );
          camera.position.z = 5;
          cameraInstance = camera;

          // 创建渲染器
          const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: performanceLevel !== 'low',
            powerPreference: 'high-performance',
          });
          renderer.setSize(window.innerWidth, window.innerHeight);
          renderer.setClearColor(0x000000, 0);
          renderer.setPixelRatio(window.devicePixelRatio > 1 ? 2 : 1);
          rendererInstance = renderer;

          // 添加渲染器到DOM（安全检查）
          if (isMounted && mountRef.current) {
            mountRef.current.appendChild(renderer.domElement);
          } else {
            // 如果已卸载，直接返回
            return undefined;
          }

          // 初始化实例组
          instancedMeshGroups = [];

          // 生成初始颜色分布
          const generateInitialColors = () => {
            const colors: THREE.Color[] = [];
            for (let i = 0; i < colorConfig.colorStops; i += 1) {
              // 计算当前色相位置 (均匀分布在色相环上)
              const hue =
                (colorConfig.baseHue + (i / colorConfig.colorStops) * colorConfig.hueRange) % 1.0;
              // 生成饱和度和亮度变化
              const saturation = 0.8 + Math.random() * 0.2; // 80-100% 饱和度
              const lightness = 0.5 + Math.random() * 0.3; // 50-80% 亮度

              // 创建颜色
              colors.push(new THREE.Color().setHSL(hue, saturation, lightness));
            }
            return colors;
          };

          // 初始颜色分布
          const initialColors = generateInitialColors();

          // 创建各种粒子组 - 使用 Promise.all 并行创建
          const createPromises = PARTICLE_GROUP_PRESETS.map((preset, index) => {
            // 调整粒子数量 - 根据密度
            const particleCount = Math.floor(
              (config[`particleCount${index + 1}` as keyof typeof config] as number) *
                densityMultiplier,
            );

            // 使用生成的颜色
            const color = initialColors[index % initialColors.length];

            // 调整运动参数
            const rotationSpeed = preset.rotationSpeed * motionParams.rotationMultiplier;
            const waveSpeed = preset.waveSpeed * motionParams.waveMultiplier;
            const waveAmplitude = preset.waveAmplitude * motionParams.waveMultiplier;
            const pulseFrequency = preset.pulseFrequency * motionParams.pulseMultiplier;
            const pulseAmplitude = preset.pulseAmplitude * motionParams.pulseMultiplier;

            // 创建粒子组 - 使用 WebWorker 和 InstancedMesh with Shader
            return worker
              ? createInstancedMeshGroup(
                  particleCount,
                  preset.range,
                  preset.size,
                  color,
                  preset.minOpacity,
                  preset.maxOpacity,
                  rotationSpeed,
                  waveSpeed,
                  waveAmplitude,
                  preset.textureKey,
                  pulseFrequency,
                  pulseAmplitude,
                )
              : // 如果 Worker 创建失败，使用同步创建方式
                Promise.resolve().then(() => {
                  if (!sceneInstance) return;

                  // 创建几何体 - 使用平面几何体
                  const geometry = new THREE.PlaneGeometry(preset.size, preset.size);

                  // 准备粒子数据
                  const initialPositions = new Float32Array(particleCount * 3);
                  const scales = new Float32Array(particleCount);
                  const phases = new Float32Array(particleCount);
                  const speeds = new Float32Array(particleCount);
                  const opacities = new Float32Array(particleCount);
                  const vertexColors = new Float32Array(particleCount * 3);

                  // 为每个实例设置数据
                  for (let i = 0; i < particleCount; i++) {
                    // 在球体中随机分布
                    const radius = Math.random() * preset.range;
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.acos(2 * Math.random() - 1);

                    const posX = radius * Math.sin(phi) * Math.cos(theta);
                    const posY = radius * Math.sin(phi) * Math.sin(theta);
                    const posZ = radius * Math.cos(phi);

                    // 设置初始位置
                    initialPositions[i * 3] = posX;
                    initialPositions[i * 3 + 1] = posY;
                    initialPositions[i * 3 + 2] = posZ;

                    // 设置其他属性
                    scales[i] = Math.random() * 2 + 0.5;
                    phases[i] = Math.random() * Math.PI * 2;
                    speeds[i] = Math.random() * 0.01 + 0.005;
                    opacities[i] =
                      Math.random() * (preset.maxOpacity - preset.minOpacity) + preset.minOpacity;

                    // 颜色变化
                    const hsl = { h: 0, s: 0, l: 0 };
                    color.getHSL(hsl);
                    const hueVariation = Math.random() * 0.1 - 0.05; // ±5%色相变化
                    const particleColor = new THREE.Color().setHSL(
                      (hsl.h + hueVariation) % 1.0,
                      0.7 + Math.random() * 0.3, // 饱和度70-100%
                      0.5 + Math.random() * 0.3, // 亮度50-80%
                    );

                    vertexColors[i * 3] = particleColor.r;
                    vertexColors[i * 3 + 1] = particleColor.g;
                    vertexColors[i * 3 + 2] = particleColor.b;
                  }

                  // 添加自定义属性到几何体
                  geometry.setAttribute(
                    'initialPosition',
                    new THREE.InstancedBufferAttribute(initialPositions, 3),
                  );
                  geometry.setAttribute('scale', new THREE.InstancedBufferAttribute(scales, 1));
                  geometry.setAttribute('phase', new THREE.InstancedBufferAttribute(phases, 1));
                  geometry.setAttribute('speed', new THREE.InstancedBufferAttribute(speeds, 1));
                  geometry.setAttribute(
                    'opacity',
                    new THREE.InstancedBufferAttribute(opacities, 1),
                  );
                  geometry.setAttribute(
                    'vertexColor',
                    new THREE.InstancedBufferAttribute(vertexColors, 3),
                  );

                  // 创建自定义 shader 材质
                  const material = new THREE.ShaderMaterial({
                    uniforms: {
                      map: { value: loadedTextures[preset.textureKey] },
                      time: { value: Math.random() * 1000 },
                      pulseFactor: { value: 1.0 },
                      waveAmplitude: { value: waveAmplitude },
                      waveSpeed: { value: waveSpeed },
                      focalPoint: { value: new THREE.Vector3(0, 0, 0) },
                      globalMotion: { value: new THREE.Vector3(0.5, 0.5, 0.5) },
                      baseColor: { value: color },
                    },
                    vertexShader,
                    fragmentShader,
                    transparent: true,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                    side: THREE.DoubleSide,
                  });

                  // 创建 InstancedMesh
                  const instancedMesh = new THREE.InstancedMesh(geometry, material, particleCount);
                  instancedMesh.frustumCulled = false; // 禁用视锥体剔除

                  // 添加到场景
                  sceneInstance.add(instancedMesh);
                  instancedMeshGroups.push(instancedMesh);

                  // 保存额外数据
                  instancedMesh.userData = {
                    time: Math.random() * 1000,
                    rotationSpeed,
                    pulseFrequency,
                    pulseAmplitude,
                  };
                });
          });

          // 等待所有粒子组创建完成
          await Promise.all(createPromises);

          // 初始化全局运动控制器
          const globalMotion = {
            amplitude: performanceLevel === 'low' ? 0.3 : 0.5,
            speed: performanceLevel === 'low' ? 0.0001 : 0.0002,
            time: 0,
          };

          // 初始化焦点区域
          const focalPoint = {
            x: 0,
            y: 0,
            z: 0,
            targetX: (Math.random() - 0.5) * 2,
            targetY: (Math.random() - 0.5) * 2,
            targetZ: (Math.random() - 0.5) * 2,
            changeTime: 0,
          };

          // 颜色自动变换控制器
          const colorShift = {
            time: 0,
            speed: colorController.transitionSpeed * 0.1,
            lastUpdateTime: 0,
            updateInterval: 0.5, // 每0.5秒更新一次全局颜色
          };

          // 初始化时钟
          clock = new THREE.Clock();
          const interval = 1000 / config.targetFPS;

          // Worker 更新颜色状态的处理函数
          const handleColorUpdate: WorkerMessageHandler<AnimationUpdateData> = e => {
            const { task, result } = e.data;

            if (task === 'updateAnimationData') {
              const { colors } = result;

              // 更新每个实例组的基础颜色
              instancedMeshGroups.forEach((instancedMesh, groupIndex) => {
                const material = instancedMesh.material as THREE.ShaderMaterial;
                if (!material.uniforms || !colors[groupIndex]) return;

                // 从 Worker 获取的 RGB 颜色
                const [r, g, b] = colors[groupIndex];
                material.uniforms.baseColor.value.setRGB(r, g, b);
              });
            }
          };

          // 添加 Worker 消息监听
          if (worker) {
            worker.addEventListener('message', handleColorUpdate);
          }

          // 动画循环
          const animate = () => {
            // 帧率控制
            const currentTime = performance.now();
            const elapsed = currentTime - lastTime;

            if (elapsed < interval) {
              animationFrameId = requestAnimationFrame(animate);
              return;
            }

            // 更新上次渲染时间
            lastTime = currentTime - (elapsed % interval);

            // 获取时间增量
            const delta = clock.getDelta();

            // 更新全局运动时间
            globalMotion.time += delta * globalMotion.speed;

            // 定期更新所有实例组的基础颜色
            colorShift.lastUpdateTime += delta;
            if (colorShift.lastUpdateTime >= colorShift.updateInterval) {
              // 重置计时器
              colorShift.lastUpdateTime = 0;

              if (worker) {
                // 使用 Worker 计算颜色变化
                worker.postMessage({
                  task: 'updateAnimationData',
                  data: {
                    time: colorShift.time,
                    delta,
                    groupCount: instancedMeshGroups.length,
                    colorController,
                    colorShift,
                  },
                });
              } else {
                // 如果没有 Worker，在主线程中处理颜色更新
                // 更新颜色渐变时间
                colorShift.time += delta * colorShift.speed;

                // 更新每个实例组的基础颜色
                instancedMeshGroups.forEach((instancedMesh, groupIndex) => {
                  const material = instancedMesh.material as THREE.ShaderMaterial;
                  if (!material.uniforms) return;

                  // 计算新的色相
                  const baseHueOffset = (colorShift.time * 0.1) % 1.0;
                  const groupCount = instancedMeshGroups.length || 1;
                  const groupHueOffset = groupIndex * (colorController.hueRange / groupCount);
                  const newHue = (colorController.baseHue + baseHueOffset + groupHueOffset) % 1.0;

                  // 为每个组创建略微不同的颜色
                  const newColor = new THREE.Color().setHSL(
                    newHue,
                    0.8 + Math.sin(colorShift.time + groupIndex) * 0.1, // 波动的饱和度
                    0.5 + Math.cos(colorShift.time * 0.7 + groupIndex) * 0.15, // 波动的亮度
                  );

                  // 更新 shader uniform
                  material.uniforms.baseColor.value = newColor;
                });
              }
            }

            // 更新焦点区域
            if (performanceLevel !== 'low' || Math.random() < 0.05) {
              focalPoint.changeTime += delta;

              // 每隔10秒更换一次焦点目标
              if (focalPoint.changeTime > 10) {
                focalPoint.targetX = (Math.random() - 0.5) * 2;
                focalPoint.targetY = (Math.random() - 0.5) * 2;
                focalPoint.targetZ = (Math.random() - 0.5) * 2;
                focalPoint.changeTime = 0;
              }

              // 平滑过渡焦点位置
              focalPoint.x += (focalPoint.targetX - focalPoint.x) * 0.01;
              focalPoint.y += (focalPoint.targetY - focalPoint.y) * 0.01;
              focalPoint.z += (focalPoint.targetZ - focalPoint.z) * 0.01;
            }

            // 更新所有实例组
            instancedMeshGroups.forEach((instancedMesh, groupIndex) => {
              // 低性能设备跳过部分组的更新
              if (performanceLevel === 'low' && groupIndex > 0 && Math.random() < 0.3) {
                return;
              }

              updateShaderParticles(instancedMesh, delta, focalPoint, globalMotion);
            });

            // 渲染场景
            if (rendererInstance && sceneInstance && cameraInstance) {
              rendererInstance.render(sceneInstance, cameraInstance);
            }
            animationFrameId = requestAnimationFrame(animate);
          };

          // 启动动画
          localIsInitialized = true;
          isInitialized = true;
          setIsLoaded(true);
          lastTime = performance.now();
          animate();

          // 处理窗口大小变化
          let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
          const handleResize = () => {
            if (resizeTimeout) clearTimeout(resizeTimeout);

            resizeTimeout = setTimeout(() => {
              if (cameraInstance && rendererInstance) {
                cameraInstance.aspect = window.innerWidth / window.innerHeight;
                cameraInstance.updateProjectionMatrix();
                rendererInstance.setSize(window.innerWidth, window.innerHeight);
              }
            }, 200);
          };

          window.addEventListener('resize', handleResize);

          // 添加可见性变化监听
          const handleVisibilityChange = () => {
            if (document.hidden) {
              // 页面不可见，暂停动画
              if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
              }
            } else {
              // 页面可见且初始化完成，恢复动画
              const shouldRestartAnimation = animationFrameId === null && localIsInitialized;
              if (shouldRestartAnimation) {
                lastTime = performance.now();
                animationFrameId = requestAnimationFrame(animate);
              }
            }
          };

          document.addEventListener('visibilitychange', handleVisibilityChange);

          // 返回清理函数
          return () => {
            isMounted = false; // 标记为已卸载
            localIsInitialized = false;
            isInitialized = false;

            if (animationFrameId !== null) {
              cancelAnimationFrame(animationFrameId);
              animationFrameId = null;
            }

            // 移除事件监听器
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (worker) {
              worker.removeEventListener('message', handleColorUpdate);
            }

            // 清理场景
            cleanupResources();
          };
        } catch (error) {
          // 允许在错误处理中使用console.error
          // eslint-disable-next-line no-console
          console.error('初始化粒子系统时出错:', error);
          return undefined;
        }
      };

      // 开始初始化
      initParticleSystem();

      // 返回清理函数
      return () => {
        if (localIsInitialized) {
          localIsInitialized = false;
          isInitialized = false;

          if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
          }

          // 清理资源
          cleanupResources();
        }
      };
    }, [density, motionIntensity, colorConfig, getDensityMultiplier, getMotionParams]);

    return (
      <div
        ref={mountRef}
        id="particles-canvas"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 1s ease-in-out',
        }}
      />
    );
  },
);

// 添加显示名称
ParticlesBackground.displayName = 'ParticlesBackground';

export default ParticlesBackground;
