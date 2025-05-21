import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import YiDengCoinChart from '@/components/charts/YiDengCoinChart';

// 模拟 Tooltip 组件
jest.mock('@/components/Tooltip', () => {
  return function MockTooltip({ point, visible }: any) {
    if (!visible) return null;
    return (
      <div data-testid="chart-tooltip">
        <div>Open: {point.open}</div>
        <div>Close: {point.close}</div>
      </div>
    );
  };
});

// 模拟 fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        data: {
          attributes: {
            ohlcv_list: [
              [1620000000000, '300', '350', '290', '320', '10000'], // 时间戳, 开盘价, 最高价, 最低价, 收盘价, 成交量
              [1620086400000, '320', '340', '310', '330', '12000'],
            ],
          },
        },
        meta: {
          base: { name: 'Test Coin', symbol: 'TC' },
          quote: { name: 'US Dollar', symbol: 'USD' },
        },
      }),
  }),
) as jest.Mock;

describe('YiDengCoinChart Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders chart component correctly', async () => {
    render(<YiDengCoinChart />);

    // 验证加载状态显示
    expect(screen.getByText('加载中...')).toBeInTheDocument();

    // 等待数据加载完成
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });

    // 验证图表标题
    expect(screen.getByText(/YIDENG COIN/)).toBeInTheDocument();

    // 验证时间周期按钮
    expect(screen.getByRole('button', { name: '5m' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '15m' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1h' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '4h' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1d' })).toBeInTheDocument();
  });

  it('changes timeframe when clicking on timeframe buttons', async () => {
    render(<YiDengCoinChart />);

    // 等待数据加载完成
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });

    // 模拟点击不同的时间周期按钮
    fireEvent.click(screen.getByRole('button', { name: '1h' }));

    // 验证 fetch 被调用
    expect(fetch).toHaveBeenCalledTimes(2); // 初始加载 + 更改时间周期后的加载

    // 验证 fetch 使用了正确的时间参数
    expect((fetch as jest.Mock).mock.calls[1][0]).toContain('hour?aggregate=1');
  });

  it('toggles chart mode when clicking on chart type button', async () => {
    render(<YiDengCoinChart />);

    // 等待数据加载完成
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });

    // 初始默认显示蜡烛图类型，按钮显示"切换到线图"
    const toggleButton = screen.getByText('chart.btn.type.line');

    // 点击按钮切换到线图模式
    fireEvent.click(toggleButton);

    // 按钮应该变为"切换到成交量"
    expect(screen.getByText('chart.btn.type.volume')).toBeInTheDocument();

    // 再次点击切换到成交量模式
    fireEvent.click(screen.getByText('chart.btn.type.volume'));

    // 按钮应该变为"切换到蜡烛图"
    expect(screen.getByText('chart.btn.type.candle')).toBeInTheDocument();
  });

  it('handles API error gracefully and shows mock data', async () => {
    // 模拟 API 请求失败
    (global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 500,
      }),
    );

    render(<YiDengCoinChart />);

    // 等待错误处理完成
    await waitFor(() => {
      expect(screen.getByText(/错误:/)).toBeInTheDocument();
      expect(screen.getByText(/显示模拟数据/)).toBeInTheDocument();
    });

    // 检查是否仍然能看到图表界面，表明使用了模拟数据
    expect(screen.getByText(/YIDENG COIN/)).toBeInTheDocument();
  });
});
