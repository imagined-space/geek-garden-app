"use client";

import React, { useEffect, useRef, memo, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { ParticleGroup, ParticlesBackgroundProps } from '@/types/particles';
import {
  PERFORMANCE_CONFIG,
  PARTICLE_GROUP_PRESETS,
  DEFAULT_COLOR_TRANSITION,
} from './constants';
import { detectPerformanceLevel } from './usePerformance';
import {loadTextures} from './textureLoader';
import { createHSLColor } from './colorUtils';

// ----------------- 单例控制器 -----------------
let sceneInstance: THREE.Scene | null = null;
let cameraInstance: THREE.PerspectiveCamera | null = null;
let rendererInstance: THREE.WebGLRenderer | null = null;
let particleGroupsInstance: ParticleGroup[] = [];
let loadedTextures: Record<string, THREE.Texture> = {};
let isInitialized = false;
let animationFrameId: number | null = null;

// ----------------- 主组件 -----------------
const ParticlesBackground: React.FC<ParticlesBackgroundProps> = memo(
  ({ density = 'normal', motionIntensity = 'normal', colorTransition }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // 使用 useMemo 来避免在每次渲染时重新创建 colorConfig 对象
    const colorConfig = useMemo(() => ({
      ...DEFAULT_COLOR_TRANSITION,
      ...colorTransition,
    }), [colorTransition]);

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

    // 创建粒子组函数
    function createParticleGroup(
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
    ): void {
      if (!sceneInstance) return;

      // 生成粒子
      const particlesGeometry = new THREE.BufferGeometry();
      const posArray = new Float32Array(count * 3);
      const opacityArray = new Float32Array(count);
      const scaleArray = new Float32Array(count);
      const speedArray = new Float32Array(count);
      const phaseArray = new Float32Array(count);
      const colorArray = new Float32Array(count * 3);

      // 设置粒子属性
      for (let i = 0; i < count; i += 1) {
        // 位置 - 随机分布在球体中
        const radius = Math.random() * range;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        posArray[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        posArray[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        posArray[i * 3 + 2] = radius * Math.cos(phi);

        // 透明度
        opacityArray[i] = Math.random() * (maxOpacity - minOpacity) + minOpacity;

        // 大小
        scaleArray[i] = Math.random() * 2 + 0.5;

        // 速度
        speedArray[i] = Math.random() * 0.01 + 0.005;

        // 相位差
        phaseArray[i] = Math.random() * Math.PI * 2;

        // 颜色变化 - 基于主色调的微妙变化
        const hsl = { h: 0, s: 0, l: 0 };
        color.getHSL(hsl);

        const hueVariation = Math.random() * 0.1 - 0.05; // ±5%色相变化
        const particleColor = createHSLColor(
          (hsl.h + hueVariation) % 1.0,
          0.7 + Math.random() * 0.3, // 饱和度70-100%
          0.5 + Math.random() * 0.3, // 亮度50-80%
        );

        colorArray[i * 3] = particleColor.r;
        colorArray[i * 3 + 1] = particleColor.g;
        colorArray[i * 3 + 2] = particleColor.b;
      }

      // 设置几何体属性
      particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
      particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

      // 创建材质
      const particlesMaterial = new THREE.PointsMaterial({
        size,
        color,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        vertexColors: true, // 启用顶点颜色
        depthWrite: false, // 改善透明度渲染
        map: loadedTextures[textureKey],
      });

      // 创建粒子系统
      const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);

      // 转换为自定义粒子组类型
      const particleGroup = particleSystem as unknown as ParticleGroup;

      // 存储额外属性
      particleGroup.userData = {
        opacityArray,
        scaleArray,
        speedArray,
        phaseArray,
        initialPositions: posArray.slice(), // 复制初始位置
        time: Math.random() * 1000, // 随机初始时间
        rotationSpeed,
        waveSpeed,
        waveAmplitude,
        pulseFrequency,
        pulseAmplitude,
      };

      // 添加到场景和粒子组
      sceneInstance.add(particleGroup);
      particleGroupsInstance.push(particleGroup);
    }

    // 更新粒子组函数
    function updateParticleGroup(
      particleSystem: ParticleGroup,
      groupIndex: number,
      delta: number,
      focalPoint: { x: number; y: number; z: number },
      globalMotion: { time: number; amplitude: number },
      colorPulse: { time: number; intensity: number },
      updateFraction: number,
    ): void {
      // 使用解构赋值获取userData中的属性
      const {
        phaseArray,
        initialPositions,
        rotationSpeed,
        waveSpeed,
        waveAmplitude,
        pulseFrequency = 0.2 + groupIndex * 0.1,
        pulseAmplitude = 0.15,
      } = particleSystem.userData;

      // 更新时间
      particleSystem.userData.time += delta;
      const {time} = particleSystem.userData;

      // 获取位置数组
      const positions = particleSystem.geometry.attributes.position.array as Float32Array;
      const count = positions.length / 3;

      // 创建脉动效果
      const pulseFactor = Math.sin(time * pulseFrequency) * pulseAmplitude + 1;

      // 更新颜色 - 为高/中性能设备添加颜色变化
      if (
        particleSystem.geometry.attributes.color &&
        Math.random() < 0.3 // 只在30%的帧更新颜色以节省性能
      ) {
        const colors = particleSystem.geometry.attributes.color.array as Float32Array;

        // 颜色脉动因子
        const colorPulseFactor = Math.sin(colorPulse.time) * colorPulse.intensity;

        // 基础颜色
        const material = particleSystem.material as THREE.PointsMaterial;
        const baseColor = material.color;
        const baseHSL = { h: 0, s: 0, l: 0 };
        baseColor.getHSL(baseHSL);

        // 每10个粒子更新一次颜色，以节约性能
        for (let i = 0; i < count; i += 10) {
          // 为每个粒子创建微妙的颜色变化
          const hueShift = Math.sin(i + colorPulse.time * (1 + i * 0.001)) * 0.05;
          const newColor = createHSLColor(
            (baseHSL.h + hueShift) % 1.0,
            Math.min(1.0, baseHSL.s + colorPulseFactor * 0.2),
            Math.min(1.0, baseHSL.l + colorPulseFactor * 0.3),
          );

          // 更新颜色
          colors[i * 3] = newColor.r;
          colors[i * 3 + 1] = newColor.g;
          colors[i * 3 + 2] = newColor.b;
        }

        particleSystem.geometry.attributes.color.needsUpdate = true;
      }

      // 更新粒子位置
      for (let i = 0; i < count; i += 1) {
        // 性能优化：部分粒子不更新位置
        if (Math.random() > updateFraction) {
          // 使用 if-else 结构代替 continue 以满足 ESLint no-continue 规则
          // 什么也不做，跳过此粒子
        } else {
          // 获取初始位置
          const ix = initialPositions[i * 3];
          const iy = initialPositions[i * 3 + 1];
          const iz = initialPositions[i * 3 + 2];

          // 计算到焦点的距离影响
          const dx = ix - focalPoint.x;
          const dy = iy - focalPoint.y;
          const dz = iz - focalPoint.z;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
          const distanceFactor = 1 / (1 + distance * 0.1);

          // 波动效果
          const particleTime = time * waveSpeed + phaseArray[i % phaseArray.length];
          const xWave = Math.sin(particleTime + ix) * waveAmplitude;
          const yWave = Math.cos(particleTime * 0.8 + iy * 2) * waveAmplitude;
          const zWave = Math.sin(particleTime * 1.2 + iz * 1.5) * waveAmplitude;

          // 全局波动效果
          const globalFactor = 0.01;
          const globalX = Math.sin(globalMotion.time + i * globalFactor) * globalMotion.amplitude;
          const globalY =
            Math.cos(globalMotion.time * 1.3 + i * globalFactor) * globalMotion.amplitude;
          const globalZ =
            Math.sin(globalMotion.time * 0.7 + i * globalFactor) * globalMotion.amplitude;

          // 综合所有效果计算新位置
          positions[i * 3] = ix + xWave * pulseFactor + globalX;
          positions[i * 3 + 1] = iy + yWave * pulseFactor + globalY;
          positions[i * 3 + 2] = iz + zWave * pulseFactor + globalZ;

          // 朝焦点方向轻微吸引
          positions[i * 3] -= dx * distanceFactor * 0.03;
          positions[i * 3 + 1] -= dy * distanceFactor * 0.03;
          positions[i * 3 + 2] -= dz * distanceFactor * 0.03;
        }
      }

      // 更新位置缓冲区
      particleSystem.geometry.attributes.position.needsUpdate = true;

      // 脉动透明度效果
      (particleSystem.material as THREE.PointsMaterial).opacity = 0.6 + Math.sin(time * 0.5) * 0.2;

      // 自动旋转
      particleSystem.rotation.x += rotationSpeed * (groupIndex % 2 === 0 ? 1 : -1);
      particleSystem.rotation.y += rotationSpeed * 1.5;
      particleSystem.rotation.z += rotationSpeed * 0.5 * (groupIndex % 2 === 0 ? -1 : 1);
    }

    // 清理资源函数
    function cleanupResources(): void {
      // 清理场景
      if (sceneInstance && particleGroupsInstance.length > 0) {
        particleGroupsInstance.forEach(system => {
          sceneInstance?.remove(system);
          system.geometry.dispose();

          if (system.material instanceof THREE.Material) {
            system.material.dispose();
          }
        });

        particleGroupsInstance = [];
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
    }

    useEffect(() => {
      // 如果已经初始化，不再重复创建
      if (isInitialized || !mountRef.current) {
        return undefined;
      }

      // 初始化标志
      let localIsInitialized = false;
      let isMounted = true; // Add mounting flag to track component mount status
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
            // Don't throw error, just return early if unmounted
            return undefined;
          }

          // 创建粒子组
          const particleGroups: ParticleGroup[] = [];
          particleGroupsInstance = particleGroups;

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

          // 创建各种粒子组
          PARTICLE_GROUP_PRESETS.forEach((preset, index) => {
            // 调整粒子数量 - 根据密度
            const particleCount = Math.floor(
              (config[`particleCount${index + 1}` as keyof typeof config] as number) * densityMultiplier,
            );

            // 使用生成的颜色
            const color = initialColors[index % initialColors.length];

            // 调整运动参数
            const rotationSpeed = preset.rotationSpeed * motionParams.rotationMultiplier;
            const waveSpeed = preset.waveSpeed * motionParams.waveMultiplier;
            const waveAmplitude = preset.waveAmplitude * motionParams.waveMultiplier;
            const pulseFrequency = preset.pulseFrequency * motionParams.pulseMultiplier;
            const pulseAmplitude = preset.pulseAmplitude * motionParams.pulseMultiplier;

            // 创建粒子组
            createParticleGroup(
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
            );
          });

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

          // 初始化颜色控制器
          const colorPulse = {
            speed: 0.3 * motionParams.pulseMultiplier,
            intensity: 0.2 * motionParams.pulseMultiplier,
            time: 0,
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

            // 更新颜色脉动时间
            colorPulse.time += delta * colorPulse.speed;

            // 更新颜色渐变时间
            colorShift.time += delta * colorShift.speed;

            // 定期更新所有粒子组的基础颜色
            colorShift.lastUpdateTime += delta;
            if (colorShift.lastUpdateTime >= colorShift.updateInterval) {
              // 重置计时器
              colorShift.lastUpdateTime = 0;

              // 更新每个粒子组的基础颜色
              particleGroups.forEach((particleSystem, groupIndex) => {
                // 计算新的色相
                const baseHueOffset = (colorShift.time * 0.1) % 1.0; // 缓慢循环整个色相环
                const groupCount = particleGroups.length || 1; // 防止除零
                const groupHueOffset = groupIndex * (colorController.hueRange / groupCount);
                const newHue = (colorController.baseHue + baseHueOffset + groupHueOffset) % 1.0;

                // 为每个组创建略微不同的颜色
                const newColor = new THREE.Color().setHSL(
                  newHue,
                  0.8 + Math.sin(colorShift.time + groupIndex) * 0.1, // 波动的饱和度
                  0.5 + Math.cos(colorShift.time * 0.7 + groupIndex) * 0.15, // 波动的亮度
                );

                // 更新材质颜色
                const material = particleSystem.material as THREE.PointsMaterial;
                material.color = newColor;
              });
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

            // 更新所有粒子组
            particleGroups.forEach((particleSystem, groupIndex) => {
              // 低性能设备跳过部分组的更新
              if (performanceLevel === 'low' && groupIndex > 0 && Math.random() < 0.3) {
                return;
              }

              updateParticleGroup(
                particleSystem,
                groupIndex,
                delta,
                focalPoint,
                globalMotion,
                colorPulse,
                config.updateFraction,
              );
            });

            // 渲染场景
            renderer.render(scene, camera);
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
            isMounted = false; // Mark as unmounted
            localIsInitialized = false;
            isInitialized = false;

            if (animationFrameId !== null) {
              cancelAnimationFrame(animationFrameId);
              animationFrameId = null;
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
    }, [
      density,
      motionIntensity,
      colorConfig, // Added colorConfig as a dependency to fix the React Hook missing dependency warning
      getDensityMultiplier,
      getMotionParams,
    ]);

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