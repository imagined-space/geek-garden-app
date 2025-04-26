

// 粒子计算函数
function calculateParticles(count) {
  return Array.from({ length: count }).map(() => ({
    size: Math.random() * 12 + 3,
    distance: Math.random() * 120 + 30,
    duration: Math.random() * 1.5 + 0.8,
    opacity: Math.random() * 0.9 + 0.3,
    delay: Math.random() * 0.3,
    direction: Math.random() * 360,
    color: Math.floor(Math.random() * 4),
  }));
}

// 预计算颜色调整
function calculateHueAdjustment(baseColors, hue) {
  // 简化的色相调整逻辑
  const adjustedColors = baseColors.map(color => {
    const hueRad = (hue * Math.PI) / 180.0;
    const cosA = Math.cos(hueRad);
    const sinA = Math.sin(hueRad);

    // 模拟 YIQ 转换
    const y = color[0] * 0.299 + color[1] * 0.587 + color[2] * 0.114;
    const i = color[0] * 0.596 + color[1] * -0.274 + color[2] * -0.322;
    const q = color[0] * 0.211 + color[1] * -0.523 + color[2] * 0.312;

    const i2 = i * cosA - q * sinA;
    const q2 = i * sinA + q * cosA;

    const r = y + 0.956 * i2 + 0.621 * q2;
    const g = y - 0.272 * i2 - 0.647 * q2;
    const b = y - 1.106 * i2 + 1.703 * q2;

    return [Math.max(0, Math.min(1, r)), Math.max(0, Math.min(1, g)), Math.max(0, Math.min(1, b))];
  });

  return adjustedColors;
}

// 处理主线程消息
self.onmessage = (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'calculateParticles':
      const particles = calculateParticles(data.count || 20);
      self.postMessage({ type: 'particles', data: particles });
      break;

    case 'calculateHueAdjustment':
      const adjustedColors = calculateHueAdjustment(data.baseColors, data.hue);
      self.postMessage({
        type: 'hueAdjustment',
        data: {
          colors: adjustedColors,
          hue: data.hue,
        },
      });
      break;

    default:
      console.warn('Unknown message type:', type);
  }
};
