import React from 'react';
import { ChartTooltipProps } from '@/types/yd-coin-chart';

const ChartTooltip: React.FC<ChartTooltipProps> = ({ point, visible, x, y }) => {
  if (!visible || !point) {
    return null;
  }

  // 计算涨跌幅
  const priceChange = ((point.close - point.open) / point.open) * 100;
  const isPositive = priceChange >= 0;

  // 格式化数字，根据数字大小调整小数位数
  const formatNumber = (num: number): string => {
    // 对于接近1的值（如稳定币价格），使用更多小数位
    if (num > 0.9 && num < 1.1) {
      return num.toFixed(6);
    }
    // 对于较大的值，使用较少小数位
    else if (num > 100) {
      return num.toFixed(2);
    }
    // 默认使用4位小数
    return num.toFixed(4);
  };

  // 格式化成交量，大数字显示为K或M
  const formatVolume = (volume: number): string => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(2)}M`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(2)}K`;
    }
    return volume.toFixed(2);
  };

  // 确保tooltip不会超出屏幕边界
  let tooltipX = x;
  let tooltipY = y;

  // 添加相对于容器的位置计算，防止tooltip超出边界
  const offsetY = 120; // 向上偏移量，避免tooltip被鼠标遮挡

  // 调整样式，使用fixed定位而不是absolute
  const tooltipStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${tooltipX}px`,
    top: `${tooltipY - offsetY}px`, // 向上偏移避免遮挡鼠标
    backgroundColor: 'rgba(10, 11, 30, 0.95)',
    border: '1px solid #05d9e8',
    borderRadius: '4px',
    padding: '8px 12px',
    color: '#fff',
    fontSize: '12px',
    zIndex: 100,
    minWidth: '180px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(4px)',
    pointerEvents: 'none', // 确保不阻挡鼠标事件
  };

  return (
    <div style={tooltipStyle}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
        <div>开盘:</div>
        <div>{formatNumber(point.open)}</div>

        <div>最高:</div>
        <div>{formatNumber(point.high)}</div>

        <div>最低:</div>
        <div>{formatNumber(point.low)}</div>

        <div>收盘:</div>
        <div>{formatNumber(point.close)}</div>

        <div>成交量:</div>
        <div>{formatVolume(point.volume)}</div>

        <div>涨跌幅:</div>
        <div style={{ color: isPositive ? '#01b574' : '#f23645' }}>
          {isPositive ? '+' : ''}
          {priceChange.toFixed(2)}%
        </div>
      </div>
    </div>
  );
};

export default ChartTooltip;
