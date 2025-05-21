import { render, screen } from '@testing-library/react';
import ChartTooltip from '@/components/charts/Tooltip';
import { ChartTooltipProps } from '@/types/yd-coin-chart';

describe('ChartTooltip Component', () => {
  // 测试数据
  const mockPoint = {
    time: 1620000000 as any,
    open: 300,
    high: 350,
    low: 290,
    close: 320,
    volume: 10000,
  };

  const mockProps: ChartTooltipProps = {
    point: mockPoint,
    visible: true,
    x: 100,
    y: 100,
    baseSymbol: 'TC',
    quoteSymbol: 'USD',
  };

  it('renders nothing when visible is false', () => {
    const { container } = render(<ChartTooltip {...mockProps} visible={false} />);

    // 确保组件没有渲染任何内容
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when point is null', () => {
    const { container } = render(<ChartTooltip {...mockProps} point={null} />);

    // 确保组件没有渲染任何内容
    expect(container).toBeEmptyDOMElement();
  });

  it('renders tooltip with correct data', () => {
    render(<ChartTooltip {...mockProps} />);

    // 验证开盘价
    expect(screen.getByText('ydCoin.tooltip.open:')).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument();

    // 验证最高价
    expect(screen.getByText('ydCoin.tooltip.high:')).toBeInTheDocument();
    expect(screen.getByText('350')).toBeInTheDocument();

    // 验证最低价
    expect(screen.getByText('ydCoin.tooltip.low:')).toBeInTheDocument();
    expect(screen.getByText('290')).toBeInTheDocument();

    // 验证收盘价
    expect(screen.getByText('ydCoin.tooltip.close:')).toBeInTheDocument();
    expect(screen.getByText('320')).toBeInTheDocument();

    // 验证成交量
    expect(screen.getByText('ydCoin.tooltip.volume:')).toBeInTheDocument();
    expect(screen.getByText('10000')).toBeInTheDocument();

    // 验证涨跌幅
    expect(screen.getByText('ydCoin.tooltip.change:')).toBeInTheDocument();

    // 收盘价 > 开盘价，应显示正的涨跌幅
    const changePercentage = +(((mockPoint.close - mockPoint.open) / mockPoint.open) * 100).toFixed(
      2,
    );
    expect(screen.getByText(`+${changePercentage}%`)).toBeInTheDocument();
  });

  it('formats volume correctly for large numbers', () => {
    // 测试百万级别的成交量格式化
    const largeVolumeProps = {
      ...mockProps,
      point: { ...mockPoint, volume: 1500000 },
    };

    render(<ChartTooltip {...largeVolumeProps} />);
    expect(screen.getByText('1.50M')).toBeInTheDocument();

    // 测试千级别的成交量格式化
    const mediumVolumeProps = {
      ...mockProps,
      point: { ...mockPoint, volume: 1500 },
    };

    render(<ChartTooltip {...mediumVolumeProps} />);
    expect(screen.getByText('1.50K')).toBeInTheDocument();
  });

  it('shows negative change percentage correctly', () => {
    // 创建一个收盘价小于开盘价的数据点
    const negativeChangeProps = {
      ...mockProps,
      point: { ...mockPoint, open: 350, close: 300 },
    };

    render(<ChartTooltip {...negativeChangeProps} />);

    // 计算预期的负变化百分比
    const changePercentage = +(
      ((negativeChangeProps.point.close - negativeChangeProps.point.open) /
        negativeChangeProps.point.open) *
      100
    ).toFixed(2);

    // 负的变化百分比应该没有 + 号
    expect(screen.getByText(`${changePercentage}%`)).toBeInTheDocument();

    // 负的变化百分比元素应该有红色样式
    const changeElement = screen.getByText(`${changePercentage}%`);
    expect(changeElement).toHaveStyle('color: #f23645');
  });
});
