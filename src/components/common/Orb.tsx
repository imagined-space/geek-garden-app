import { useEffect, useMemo, useRef, useState } from 'react';
import { Renderer, Program, Mesh, Triangle, Vec3 } from 'ogl';
import { vert, frag } from '@/utils/orb/shader';

interface OrbProps {
  hue?: number;
  hoverIntensity?: number;
  rotateOnHover?: boolean;
  forceHoverState?: boolean;
  text?: string;
  textColor?: string;
  textSize?: string;
}

// 为粒子定义明确的类型而不是any
interface Particle {
  size: number;
  distance: number;
  duration: number;
  opacity: number;
  delay: number;
  direction: number;
  color: number;
}

export default function Orb({
  hue = 0,
  hoverIntensity = 0.2,
  rotateOnHover = true,
  forceHoverState = false,
  text = 'G',
  textColor = 'transparent',
  textSize = '10rem',
}: OrbProps) {
  const ctnDom = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // 粒子和颜色状态 - 由 Worker 计算
  const webWorkerRef = useRef<Worker | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]); // 使用正确的类型
  const [adjustedColors, setAdjustedColors] = useState<number[][]>([]);
  const lastHue = useRef(hue);

  // 提前创建预计算的颜色 uniform
  const precomputedColorsRef = useRef(new Float32Array(9));
  const resolutionVec = useRef(new Vec3());
  const adaptiveFrameskip = useRef({
    frameTime: 1000 / 60,
    skipCounter: 0,
    skipThreshold: 2,
  });

  // 使用 useMemo 缓存重计算的值
  const rendererOptions = useMemo(
    () => ({
      alpha: true,
      premultipliedAlpha: false,
      powerPreference: 'high-performance',
      depth: false,
      stencil: false,
    }),
    [],
  );
  useEffect(() => {
    // 确保只在客户端创建Web Worker
    if (typeof window !== 'undefined') {
      // 只有在webWorker不存在时才初始化
      if (!webWorkerRef.current) {
        webWorkerRef.current = new Worker('/orb/web-worker.js', {
          type: 'module',
        });

        // 监听Worker的消息
        webWorkerRef.current.onmessage = event => {
          const { type, data } = event.data;

          if (type === 'particles') {
            setParticles(data);
          } else if (type === 'hueAdjustment') {
            setAdjustedColors(data.colors);
            lastHue.current = data.hue;
          }
        };

        // 请求初始粒子数据
        webWorkerRef.current.postMessage({
          type: 'calculateParticles',
          data: { count: 20 },
        });
      }

      // 当hue变化时或初始化时，请求色相调整
      if (webWorkerRef.current && hue !== lastHue.current) {
        webWorkerRef.current.postMessage({
          type: 'calculateHueAdjustment',
          data: {
            baseColors: [
              [0.611765, 0.262745, 0.996078],
              [0.298039, 0.760784, 0.913725],
              [0.062745, 0.078431, 0.6],
            ],
            hue,
          },
        });
      }
    }

    return () => {
      // 清理Web Worker
      if (webWorkerRef.current) {
        webWorkerRef.current.terminate();
        webWorkerRef.current = null;
      }
    };
  }, [hue]);

  // 更新预计算的颜色数组
  useEffect(() => {
    if (adjustedColors.length === 3) {
      const arr = precomputedColorsRef.current;
      for (let i = 0; i < 3; i += 1) {
        for (let j = 0; j < 3; j += 1) {
          arr[i * 3 + j] = adjustedColors[i][j];
        }
      }
    }
  }, [adjustedColors]);

  // WebGL 渲染
  useEffect(() => {
    const container = ctnDom.current;
    if (!container) return;

    const renderer = new Renderer(rendererOptions);
    const { gl } = renderer;
    gl.clearColor(0, 0, 0, 0);
    container.appendChild(gl.canvas);

    const geometry = new Triangle(gl);
    
    // 提前声明所有变量，解决"变量使用前定义"问题
    let rafId: number;
    let targetHover = 0;
    let lastTime = 0;
    let currentRot = 0;
    const rotationSpeed = 0.3; // radians per second
    
    // 提前声明程序和网格
    const program = new Program(gl, {
      vertex: vert,
      fragment: frag,
      uniforms: {
        iTime: { value: 0 },
        iResolution: {
          value: new Vec3(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height),
        },
        hue: { value: hue },
        hover: { value: 0 },
        rot: { value: 0 },
        hoverIntensity: { value: hoverIntensity },
        // 将预计算的颜色传递给着色器，减少着色器中的计算
        precomputedColors: { value: precomputedColorsRef.current },
      },
    });
    
    const mesh = new Mesh(gl, { geometry, program });
    
    function resize() {
      if (!container) return;
      const dpr = window.devicePixelRatio || 1;
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width * dpr, height * dpr);
      gl.canvas.style.width = `${width}px`;
      gl.canvas.style.height = `${height}px`;

      // 使用预先分配的向量对象
      resolutionVec.current.set(
        gl.canvas.width,
        gl.canvas.height,
        gl.canvas.width / gl.canvas.height,
      );
      program.uniforms.iResolution.value = resolutionVec.current;
    }
    
    // 使用防抖函数优化 resize 事件
    let resizeTimeout: number;
    const handleResize = (): void => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(resize, 100);
    };
    
    // 预定义更新函数
    const update = (t: number): void => {
      // 适应性帧率控制：在性能问题下降低频率
      const now = performance.now();
      const timeSinceLastFrame = now - lastTime;

      // 自适应帧跳过：如果帧时间短于目标且不在交互状态
      adaptiveFrameskip.current.skipCounter += 1;
      if (
        timeSinceLastFrame < adaptiveFrameskip.current.frameTime &&
        program.uniforms.hover.value < 0.1 &&
        !forceHoverState &&
        adaptiveFrameskip.current.skipCounter < adaptiveFrameskip.current.skipThreshold
      ) {
        rafId = requestAnimationFrame(update);
        return;
      }

      adaptiveFrameskip.current.skipCounter = 0;
      lastTime = now;

      // 如果颜色已更新，将其应用到着色器
      program.uniforms.precomputedColors.value = precomputedColorsRef.current;

      // 更新着色器 uniforms
      const currentTime = t * 0.001;
      const dt = currentTime - (program.uniforms.iTime.value || 0);
      program.uniforms.iTime.value = currentTime;

      // 只有当值变化时才更新 uniform
      if (program.uniforms.hue.value !== hue) {
        program.uniforms.hue.value = hue;
      }

      if (program.uniforms.hoverIntensity.value !== hoverIntensity) {
        program.uniforms.hoverIntensity.value = hoverIntensity;
      }

      // 平滑悬停状态变化
      const effectiveHover = forceHoverState ? 1 : targetHover;
      if (Math.abs(program.uniforms.hover.value - effectiveHover) > 0.001) {
        program.uniforms.hover.value += (effectiveHover - program.uniforms.hover.value) * 0.1;
      }

      // 条件更新旋转
      if (rotateOnHover && effectiveHover > 0.5) {
        currentRot += dt * rotationSpeed;
        program.uniforms.rot.value = currentRot;
      }

      // 渲染场景
      renderer.render({ scene: mesh });
      rafId = requestAnimationFrame(update);
    };

    window.addEventListener('resize', handleResize);
    resize();

    // 优化鼠标移动处理器，使用距离平方计算而不是距离
    const handleMouseMove = (e: MouseEvent): void => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const { width, height } = rect;
      const size = Math.min(width, height);
      const centerX = width / 2;
      const centerY = height / 2;
      const uvX = ((x - centerX) / size) * 2.0;
      const uvY = ((y - centerY) / size) * 2.0;

      // 使用距离平方避免开方操作
      const distSq = uvX * uvX + uvY * uvY;
      if (distSq < 0.64) {
        // 0.8^2 = 0.64
        targetHover = 1;
      } else {
        targetHover = 0;
      }
    };

    const handleMouseLeave = (): void => {
      targetHover = 0;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    // 监听 WebGL 上下文丢失事件
    const handleContextLost = (e: Event): void => {
      e.preventDefault();
      cancelAnimationFrame(rafId);
    };

    // 监听 WebGL 上下文恢复事件
    const handleContextRestored = (): void => {
      // 重新初始化必要资源
      resize();
      rafId = requestAnimationFrame(update);
    };

    gl.canvas.addEventListener('webglcontextlost', handleContextLost);
    gl.canvas.addEventListener('webglcontextrestored', handleContextRestored);

    // 启动动画循环
    rafId = requestAnimationFrame(update);

    // eslint-disable-next-line consistent-return
    return () => {
      // 确保只取消定义过的帧请求
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      clearTimeout(resizeTimeout);

      // 清理事件监听器
      gl.canvas.removeEventListener('webglcontextlost', handleContextLost);
      gl.canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);

      // 释放 WebGL 资源
      container.removeChild(gl.canvas);
      gl.getExtension('WEBGL_lose_context')?.loseContext();

      // 清理其他资源
      geometry.remove();
      program.remove();
      mesh.setParent(null); // 解除 Mesh 的父级关系
    };
  }, [hue, hoverIntensity, rotateOnHover, forceHoverState, rendererOptions]);

  // 修改嵌套三元表达式为更清晰的函数
  const getParticleColor = (colorIndex: number): string => {
    if (colorIndex === 0) return 'var(--neon-blue)';
    if (colorIndex === 1) return 'var(--neon-purple)';
    if (colorIndex === 2) return 'var(--neon-pink)';
    return 'var(--neon-green)';
  };

  return (
    <div ref={ctnDom} className="w-full h-full relative">
      {/* 添加居中的文字层 */}
      <div
        className="absolute inset-0 flex items-center justify-center z-10"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          className={`font-bold orb-center-text transition-all duration-300 ${isHovered ? 'scale-125' : 'scale-100'}`}
          style={{
            fontSize: textSize,
            background: `linear-gradient(135deg, var(--neon-blue), var(--neon-purple), var(--neon-pink))`,
            backgroundSize: isHovered ? '200% 200%' : '100% 100%',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: textColor,
            transform: `translateY(-5%) ${isHovered ? 'rotate(5deg)' : 'rotate(0deg)'}`,
            cursor: 'pointer',
            position: 'relative',
            animation: isHovered ? 'gradient-shift 2s ease infinite' : 'none',
            fontFamily: 'var(--terminal-font)',
            fontWeight: 900,
            letterSpacing: '-0.05em',
          }}
        >
          {text}

          {/* 鼠标悬停时显示计算好的粒子效果 */}
          {isHovered && particles.length > 0 && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="orb-particles-container">
                {particles.map((particle, i) => (
                  <div
                    key={i}
                    className="orb-particle"
                    style={
                      {
                        '--particle-size': `${particle.size}px`,
                        '--particle-distance': `${particle.distance}px`,
                        '--particle-duration': `${particle.duration}s`,
                        '--particle-opacity': `${particle.opacity}`,
                        '--particle-delay': `${particle.delay}s`,
                        '--particle-direction': `${particle.direction}deg`,
                        '--particle-color': getParticleColor(particle.color),
                        background: 'var(--particle-color)',
                      } as React.CSSProperties
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* 为了保持性能，只在悬停时加载故障效果 */}
          {isHovered && (
            <>
              <div
                className="absolute inset-0 cyberpunk-glitch-clip -z-10"
                style={{
                  content: "''",
                  background: `linear-gradient(135deg, var(--neon-blue), var(--neon-purple))`,
                  backgroundSize: '200% 200%',
                  left: '3px',
                  opacity: 0.3,
                  animation: 'glitch-animation 1.5s ease infinite alternate-reverse',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                {text}
              </div>
              <div
                className="absolute inset-0 cyberpunk-glitch-clip -z-10"
                style={{
                  content: "''",
                  background: `linear-gradient(135deg, var(--neon-pink), var(--neon-purple))`,
                  backgroundSize: '200% 200%',
                  left: '-3px',
                  opacity: 0.3,
                  animation: 'glitch-animation 2s ease infinite alternate',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                {text}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}