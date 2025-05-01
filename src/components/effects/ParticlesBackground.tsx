"use client";

import React, { useEffect, useRef, memo, useState, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { ParticlesBackgroundProps } from '@/types/particles';
import {
  PERFORMANCE_CONFIG,
  PARTICLE_GROUP_PRESETS,
  DEFAULT_COLOR_TRANSITION,
} from './constants';
import { detectPerformanceLevel } from './usePerformance';
import { loadTextures } from './textureLoader';
import { createHSLColor } from './colorUtils';

// ----------------- 单例控制器 -----------------
let sceneInstance: THREE.Scene | null = null;
let cameraInstance: THREE.PerspectiveCamera | null = null;
let rendererInstance: THREE.WebGLRenderer | null = null;
let instancedMeshGroups: THREE.InstancedMesh[] = [];
let loadedTextures: Record<string, THREE.Texture> = {};
let isInitialized = false;
let animationFrameId: number | null = null;
let dummyObject = new THREE.Object3D(); // 用于更新实例位置和旋转

// 保存每个实例的数据
interface InstanceData {
  initialPosition: THREE.Vector3;
  scale: number;
  speed: number;
  phase: number;
  opacity: number;
}

// 每个粒子组的实例数据
interface InstancedMeshGroupData {
  instances: InstanceData[];
  time: number;
  rotationSpeed: number;
  waveSpeed: number;
  waveAmplitude: number;
  pulseFrequency: number;
  pulseAmplitude: number;
}

// 存储实例数据的映射
let instancedMeshDataMap = new Map<THREE.InstancedMesh, InstancedMeshGroupData>();

// ----------------- 主组件 -----------------
const ParticlesBackground: React.FC<ParticlesBackgroundProps> = memo(
  ({ density = 'high', motionIntensity = 'high', colorTransition }) => {
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
    ): void {
      if (!sceneInstance) return;

      // 创建几何体 - 使用平面几何体代替点
      const geometry = new THREE.PlaneGeometry(size, size);

      // 创建材质
      const material = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        map: loadedTextures[textureKey],
      });

      // 创建 InstancedMesh
      const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
      instancedMesh.frustumCulled = false; // 禁用视锥体剔除以避免边缘粒子闪烁

      // 创建实例数据
      const instanceData: InstanceData[] = [];

      for (let i = 0; i < count; i++) {
        // 在球体中随机分布
        const radius = Math.random() * range;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        const posX = radius * Math.sin(phi) * Math.cos(theta);
        const posY = radius * Math.sin(phi) * Math.sin(theta);
        const posZ = radius * Math.cos(phi);

        // 初始化位置和旋转
        dummyObject.position.set(posX, posY, posZ);
        dummyObject.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        dummyObject.scale.set(1, 1, 1);
        dummyObject.updateMatrix();
        instancedMesh.setMatrixAt(i, dummyObject.matrix);

        // 为每个实例存储额外数据
        instanceData.push({
          initialPosition: new THREE.Vector3(posX, posY, posZ),
          scale: Math.random() * 2 + 0.5,
          speed: Math.random() * 0.01 + 0.005,
          phase: Math.random() * Math.PI * 2,
          opacity: Math.random() * (maxOpacity - minOpacity) + minOpacity,
        });

        // 为每个实例设置颜色 - 基于主色调的微妙变化
        const hsl = { h: 0, s: 0, l: 0 };
        color.getHSL(hsl);

        const hueVariation = Math.random() * 0.1 - 0.05; // ±5%色相变化
        const particleColor = createHSLColor(
          (hsl.h + hueVariation) % 1.0,
          0.7 + Math.random() * 0.3, // 饱和度70-100%
          0.5 + Math.random() * 0.3, // 亮度50-80%
        );

        // 设置实例颜色
        instancedMesh.setColorAt(i, particleColor);
      }

      // 更新实例矩阵和颜色
      instancedMesh.instanceMatrix.needsUpdate = true;
      if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;

      // 存储实例数据
      instancedMeshDataMap.set(instancedMesh, {
        instances: instanceData,
        time: Math.random() * 1000, // 随机初始时间
        rotationSpeed,
        waveSpeed,
        waveAmplitude,
        pulseFrequency,
        pulseAmplitude,
      });

      // 添加到场景和实例组
      sceneInstance.add(instancedMesh);
      instancedMeshGroups.push(instancedMesh);
    }

    // 更新粒子组函数 - 使用 InstancedMesh
    function updateInstancedMeshGroup(
      instancedMesh: THREE.InstancedMesh,
      groupIndex: number,
      delta: number,
      focalPoint: { x: number; y: number; z: number },
      globalMotion: { time: number; amplitude: number },
      colorPulse: { time: number; intensity: number },
      updateFraction: number,
    ): void {
      // 获取实例数据
      const groupData = instancedMeshDataMap.get(instancedMesh);
      if (!groupData) return;

      // 更新时间
      groupData.time += delta;
      const { time, instances, rotationSpeed, waveSpeed, waveAmplitude, pulseFrequency, pulseAmplitude } = groupData;

      // 创建脉动效果
      const pulseFactor = Math.sin(time * pulseFrequency) * pulseAmplitude + 1;

      // 颜色脉动
      if (Math.random() < 0.3) { // 只在30%的帧更新颜色以节省性能
        // 颜色脉动因子
        const colorPulseFactor = Math.sin(colorPulse.time) * colorPulse.intensity;

        // 基础颜色
        const material = instancedMesh.material as THREE.MeshBasicMaterial;
        const baseColor = material.color;
        const baseHSL = { h: 0, s: 0, l: 0 };
        baseColor.getHSL(baseHSL);

        // 每10个实例更新一次颜色，以节约性能
        for (let i = 0; i < instances.length; i += 10) {
          if (instancedMesh.instanceColor) {
            // 为每个实例创建微妙的颜色变化
            const hueShift = Math.sin(i + colorPulse.time * (1 + i * 0.001)) * 0.05;
            const newColor = createHSLColor(
              (baseHSL.h + hueShift) % 1.0,
              Math.min(1.0, baseHSL.s + colorPulseFactor * 0.2),
              Math.min(1.0, baseHSL.l + colorPulseFactor * 0.3),
            );

            // 更新实例颜色
            instancedMesh.setColorAt(i, newColor);
          }
        }

        if (instancedMesh.instanceColor) instancedMesh.instanceColor.needsUpdate = true;
      }

      // 更新实例位置和旋转
      for (let i = 0; i < instances.length; i++) {
        // 性能优化：根据 updateFraction 参数决定更新哪些粒子
        if (Math.random() > updateFraction) continue;

        const instance = instances[i];
        const { initialPosition, phase } = instance;

        // 计算到焦点的距离影响
        const dx = initialPosition.x - focalPoint.x;
        const dy = initialPosition.y - focalPoint.y;
        const dz = initialPosition.z - focalPoint.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const distanceFactor = 1 / (1 + distance * 0.1);

        // 波动效果
        const particleTime = time * waveSpeed + phase;
        const xWave = Math.sin(particleTime + initialPosition.x) * waveAmplitude;
        const yWave = Math.cos(particleTime * 0.8 + initialPosition.y * 2) * waveAmplitude;
        const zWave = Math.sin(particleTime * 1.2 + initialPosition.z * 1.5) * waveAmplitude;

        // 全局波动效果
        const globalFactor = 0.01;
        const globalX = Math.sin(globalMotion.time + i * globalFactor) * globalMotion.amplitude;
        const globalY = Math.cos(globalMotion.time * 1.3 + i * globalFactor) * globalMotion.amplitude;
        const globalZ = Math.sin(globalMotion.time * 0.7 + i * globalFactor) * globalMotion.amplitude;

        // 综合所有效果计算新位置
        const newX = initialPosition.x + xWave * pulseFactor + globalX - dx * distanceFactor * 0.03;
        const newY = initialPosition.y + yWave * pulseFactor + globalY - dy * distanceFactor * 0.03;
        const newZ = initialPosition.z + zWave * pulseFactor + globalZ - dz * distanceFactor * 0.03;

        // 更新实例矩阵
        dummyObject.position.set(newX, newY, newZ);
        
        // 添加旋转效果
        dummyObject.rotation.x = time * rotationSpeed * (groupIndex % 2 === 0 ? 1 : -1);
        dummyObject.rotation.y = time * rotationSpeed * 1.5;
        dummyObject.rotation.z = time * rotationSpeed * 0.5 * (groupIndex % 2 === 0 ? -1 : 1);
        
        // 设置缩放
        const scaleFactor = instance.scale * (1 + Math.sin(time * 0.5) * 0.1);
        dummyObject.scale.set(scaleFactor, scaleFactor, scaleFactor);
        
        dummyObject.updateMatrix();
        instancedMesh.setMatrixAt(i, dummyObject.matrix);
      }

      // 更新实例矩阵
      instancedMesh.instanceMatrix.needsUpdate = true;

      // 脉动透明度效果
      (instancedMesh.material as THREE.MeshBasicMaterial).opacity = 0.6 + Math.sin(time * 0.5) * 0.2;
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
        instancedMeshDataMap.clear();
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
          instancedMeshDataMap.clear();

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

            // 创建粒子组 - 使用 InstancedMesh
            createInstancedMeshGroup(
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

            // 定期更新所有实例组的基础颜色
            colorShift.lastUpdateTime += delta;
            if (colorShift.lastUpdateTime >= colorShift.updateInterval) {
              // 重置计时器
              colorShift.lastUpdateTime = 0;

              // 更新每个实例组的基础颜色
              instancedMeshGroups.forEach((instancedMesh, groupIndex) => {
                // 计算新的色相
                const baseHueOffset = (colorShift.time * 0.1) % 1.0; // 缓慢循环整个色相环
                const groupCount = instancedMeshGroups.length || 1; // 防止除零
                const groupHueOffset = groupIndex * (colorController.hueRange / groupCount);
                const newHue = (colorController.baseHue + baseHueOffset + groupHueOffset) % 1.0;

                // 为每个组创建略微不同的颜色
                const newColor = new THREE.Color().setHSL(
                  newHue,
                  0.8 + Math.sin(colorShift.time + groupIndex) * 0.1, // 波动的饱和度
                  0.5 + Math.cos(colorShift.time * 0.7 + groupIndex) * 0.15, // 波动的亮度
                );

                // 更新材质颜色
                const material = instancedMesh.material as THREE.MeshBasicMaterial;
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

            // 更新所有实例组
            instancedMeshGroups.forEach((instancedMesh, groupIndex) => {
              // 低性能设备跳过部分组的更新
              if (performanceLevel === 'low' && groupIndex > 0 && Math.random() < 0.3) {
                return;
              }

              updateInstancedMeshGroup(
                instancedMesh,
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
      colorConfig,
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