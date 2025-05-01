// Worker 代码作为字符串
export const particleWorkerCode = `
  // Web Worker 处理粒子计算
  self.onmessage = function(e) {
    const { 
      task, 
      data 
    } = e.data;
    
    switch (task) {
      case 'generateInitialData':
        const initialData = generateInitialData(data);
        self.postMessage({ task, result: initialData });
        break;
      
      case 'updateAnimationData':
        const updatedData = updateAnimationData(data);
        self.postMessage({ task, result: updatedData });
        break;
      
      default:
        self.postMessage({ error: 'Unknown task' });
    }
  };
  
  // 生成初始粒子数据
  function generateInitialData({ 
    count, 
    range, 
    minOpacity, 
    maxOpacity, 
    color 
  }) {
    const initialPositions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const phases = new Float32Array(count);
    const speeds = new Float32Array(count);
    const opacities = new Float32Array(count);
    const vertexColors = new Float32Array(count * 3);
    
    // 为每个实例设置数据
    for (let i = 0; i < count; i++) {
      // 在球体中随机分布
      const radius = Math.random() * range;
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
      opacities[i] = Math.random() * (maxOpacity - minOpacity) + minOpacity;
      
      // 颜色变化 - 基于主色调的微妙变化
      // 将 HSL 转换为自定义实现，因为 Worker 中没有 THREE.Color
      const { h, s, l } = color;
      const hueVariation = Math.random() * 0.1 - 0.05; // ±5%色相变化
      const newHue = ((h + hueVariation) % 1.0 + 1.0) % 1.0; // 确保在 0-1 范围内
      const newSaturation = 0.7 + Math.random() * 0.3; // 饱和度70-100%
      const newLightness = 0.5 + Math.random() * 0.3; // 亮度50-80%
      
      // 简单的 HSL 到 RGB 转换
      const rgb = hslToRgb(newHue, newSaturation, newLightness);
      vertexColors[i * 3] = rgb[0];
      vertexColors[i * 3 + 1] = rgb[1];
      vertexColors[i * 3 + 2] = rgb[2];
    }
    
    return {
      initialPositions,
      scales,
      phases,
      speeds,
      opacities,
      vertexColors
    };
  }
  
  // 更新动画数据
  function updateAnimationData({ 
    time, 
    delta, 
    groupCount, 
    colorController,
    colorShift
  }) {
    // 更新全局颜色数据
    const colors = [];
    
    // 更新颜色渐变时间
    colorShift.time += delta * colorShift.speed;
    
    for (let groupIndex = 0; groupIndex < groupCount; groupIndex++) {
      // 计算新的色相
      const baseHueOffset = (colorShift.time * 0.1) % 1.0;
      const groupHueOffset = groupIndex * (colorController.hueRange / groupCount);
      const newHue = (colorController.baseHue + baseHueOffset + groupHueOffset) % 1.0;

      // 波动的饱和度和亮度
      const saturation = 0.8 + Math.sin(colorShift.time + groupIndex) * 0.1;
      const lightness = 0.5 + Math.cos(colorShift.time * 0.7 + groupIndex) * 0.15;
      
      // 转换为 RGB
      const rgb = hslToRgb(newHue, saturation, lightness);
      colors.push(rgb);
    }
    
    return {
      time: time + delta,
      colors
    };
  }
  
  // HSL 到 RGB 转换函数
  function hslToRgb(h, s, l) {
    let r, g, b;

    if (s === 0) {
      r = g = b = l; // 灰度
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return [r, g, b];
  }
`;

// 安全地创建 Worker
export function createParticleWorker(): Worker | null {
  // 检查是否支持 Worker 和是否在浏览器环境
  if (typeof window === 'undefined' || !window.Worker) {
    return null;
  }

  try {
    // 创建 Blob URL
    const blob = new Blob([particleWorkerCode], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);

    // 创建 Worker
    const worker = new Worker(url);

    // 在适当时机释放 URL
    URL.revokeObjectURL(url);

    return worker;
  } catch (error) {
    console.error('创建 Worker 失败:', error);
    return null;
  }
}
