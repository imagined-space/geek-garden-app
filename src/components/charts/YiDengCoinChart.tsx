'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
  IChartApi,
  ISeriesApi,
  UTCTimestamp,
  CandlestickData,
  HistogramData,
  LineData,
  MouseEventParams,
  Time,
} from 'lightweight-charts';
import { GeckoTerminalResponse, CoinDataPoint } from '@/types/yd-coin-chart';
import ChartTooltip from './Tooltip'; // 导入 Tooltip 组件

const YiDengCoinChart = () => {
  const [data, setData] = useState<CoinDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'candle' | 'line' | 'volume'>('candle');

  // 添加Tooltip相关状态
  const [tooltipVisible, setTooltipVisible] = useState<boolean>(false);
  const [tooltipPoint, setTooltipPoint] = useState<CoinDataPoint | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 添加代币元数据状态
  const [baseToken, setBaseToken] = useState<{ name: string; symbol: string }>({
    name: '',
    symbol: '',
  });
  const [quoteToken, setQuoteToken] = useState<{ name: string; symbol: string }>({
    name: '',
    symbol: '',
  });

  // 引用容器和图表
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const lineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null);

  // 使用当前日期
  const [currentDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // 时间周期选择
  const [timeframe, setTimeframe] = useState<'5m' | '15m' | '1h' | '4h' | '1d'>('1d');

  // 根据时间戳查找对应的数据点
  const findDataPointByTime = (time: Time | undefined): CoinDataPoint | null => {
    if (!time || typeof time !== 'number' || data.length === 0) return null;

    const timestamp = time as UTCTimestamp;
    return data.find(item => item.time === timestamp) || null;
  };

  // 从 GeckoTerminal API 获取数据
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 构建 API URL，这里使用样例地址，实际使用时可能需要替换为真实的代币地址
        // 默认使用 ETH 网络上的某个代币作为示例
        const network = 'eth'; // 以太坊网络
        const poolAddress = '0x60594a405d53811d3bc4766596efd80fd545a270'; // ETH-USDT 池作为示例

        // 构建时间参数
        let timeUnit = ''; // 时间单位
        let timeAggregate = 1; // 时间数值

        switch (timeframe) {
          case '5m':
            timeUnit = 'minute';
            timeAggregate = 5;
            break;
          case '15m':
            timeUnit = 'minute';
            timeAggregate = 15;
            break;
          case '1h':
            timeUnit = 'hour';
            timeAggregate = 1;
            break;
          case '4h':
            timeUnit = 'hour';
            timeAggregate = 4;
            break;
          case '1d':
            timeUnit = 'day';
            timeAggregate = 1;
            break;
          default:
            timeUnit = 'day';
            timeAggregate = 1;
        }

        // 获取 K 线数据
        const apiUrl = `https://api.geckoterminal.com/api/v2/networks/${network}/pools/${poolAddress}/ohlcv/${timeUnit}?aggregate=${timeAggregate}`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(`API 请求失败: ${response.status}`);
        }

        const json: GeckoTerminalResponse = await response.json();

        // 设置代币元数据
        if (json.meta) {
          setBaseToken({
            name: json.meta.base.name || '',
            symbol: json.meta.base.symbol || '',
          });
          setQuoteToken({
            name: json.meta.quote.name || '',
            symbol: json.meta.quote.symbol || '',
          });
        }

        // 解析数据
        const candleData: CoinDataPoint[] = json.data.attributes.ohlcv_list.map(item => ({
          time: (item[0] / 1000) as UTCTimestamp, // 转换为秒级时间戳
          open: parseFloat(item[1]), // 开盘价
          high: parseFloat(item[2]), // 最高价
          low: parseFloat(item[3]), // 最低价
          close: parseFloat(item[4]), // 收盘价
          volume: parseFloat(item[5]), // 成交量
        }));

        setData(candleData);

        // 设置当前价格和价格变化
        if (candleData.length > 0) {
          const latestData = candleData[candleData.length - 1];
          setCurrentPrice(latestData.close);

          // 计算24小时变化率
          if (candleData.length > 1) {
            const previousData = candleData[candleData.length - 2];
            const change = ((latestData.close - previousData.close) / previousData.close) * 100;
            setPriceChange(change);
          }
        }
      } catch (err) {
        console.error('获取数据失败:', err);
        setError(err instanceof Error ? err.message : '未知错误');

        // 生成模拟数据以便在 API 未连接时展示
        generateMockData();
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [timeframe]);

  // 生成模拟数据（当 API 请求失败时使用）
  const generateMockData = () => {
    const mockData: CoinDataPoint[] = [];
    let price = 450; // 起始价格

    // 生成从3月2日到今天的数据
    const today = new Date();
    const startDate = new Date(today.getFullYear(), 2, 2); // 3月2日

    const currentDay = new Date(startDate);

    // 生成一个整体下降趋势
    while (currentDay <= today) {
      if (currentDay.getDay() !== 0 && currentDay.getDay() !== 6) {
        // 排除周末
        const dayProgress =
          (currentDay.getTime() - startDate.getTime()) / (today.getTime() - startDate.getTime());

        // 随着时间推移，逐渐下降
        const trend = -170 * dayProgress;

        // 添加随机波动
        const volatility = (Math.random() - 0.5) * 20;

        // 计算新价格，并确保在250-450之间
        price = Math.max(250, Math.min(450, price + volatility + trend * 0.1));

        // 随机生成开盘价（前一天收盘价附近）
        const open =
          mockData.length === 0 ? price + Math.random() * 10 : mockData[mockData.length - 1].close;

        // 高点至少是开盘价和收盘价中的较高者
        const maxPrice = Math.max(price, open);
        const high = maxPrice + Math.random() * 5;

        // 低点至少是开盘价和收盘价中的较低者
        const minPrice = Math.min(price, open);
        const low = Math.max(minPrice - Math.random() * 5, price * 0.95); // 确保不会太低

        const dayData: CoinDataPoint = {
          time: Math.floor(currentDay.getTime() / 1000) as UTCTimestamp,
          open: parseFloat(open.toFixed(2)),
          high: parseFloat(high.toFixed(2)),
          low: parseFloat(low.toFixed(2)),
          close: parseFloat(price.toFixed(2)),
          volume: Math.floor(Math.random() * 45000 + 15000),
        };

        mockData.push(dayData);
      }

      // 移到下一天
      currentDay.setDate(currentDay.getDate() + 1);
    }

    // 确保最后一天的价格为270.23
    if (mockData.length > 0) {
      mockData[mockData.length - 1].close = 270.23;
      mockData[mockData.length - 1].open = 312.84;
      mockData[mockData.length - 1].high = 315.45;
      mockData[mockData.length - 1].low = 270.0;
      mockData[mockData.length - 1].volume = 38000;
    }

    setData(mockData);
    setCurrentPrice(mockData.length > 0 ? mockData[mockData.length - 1].close : null);
    setPriceChange(-12.43); // 模拟价格变化

    // 设置模拟的代币元数据
    setBaseToken({ name: 'YiDeng Coin', symbol: 'GC' });
    setQuoteToken({ name: 'US Dollar', symbol: 'USD' });
  };

  // 初始化图表
  useEffect(() => {
    if (chartContainerRef.current && !chartRef.current) {
      // 创建图表
      chartRef.current = createChart(chartContainerRef.current, {
        layout: {
          background: { color: '#0a0b1e' },
          textColor: '#8884d8',
        },
        grid: {
          vertLines: { color: 'rgba(255, 255, 255, 0.1)' },
          horzLines: { color: 'rgba(255, 255, 255, 0.1)' },
        },
        timeScale: {
          borderColor: '#555',
          timeVisible: true,
          secondsVisible: false,
        },
        crosshair: {
          mode: 1,
          vertLine: {
            color: '#ff2a6d',
            width: 1,
            style: 2, // 虚线
          },
          horzLine: {
            color: '#ff2a6d',
            width: 1,
            style: 2, // 虚线
          },
        },
        width: chartContainerRef.current.clientWidth,
        height: 400,
      });

      // 创建蜡烛图系列
      candleSeriesRef.current = chartRef.current.addSeries(CandlestickSeries, {
        upColor: '#01b574',
        downColor: '#f23645',
        borderDownColor: '#f23645',
        borderUpColor: '#01b574',
        wickDownColor: '#f23645',
        wickUpColor: '#01b574',
      });

      // 创建成交量系列
      volumeSeriesRef.current = chartRef.current.addSeries(HistogramSeries, {
        color: '#555555',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '', // 与主图表分离
      });

      // 创建线图系列
      lineSeriesRef.current = chartRef.current.addSeries(LineSeries, {
        color: '#05d9e8',
        lineWidth: 2,
      });

      // 添加窗口调整大小事件
      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      };

      window.addEventListener('resize', handleResize);

      // 清理函数
      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
          candleSeriesRef.current = null;
          volumeSeriesRef.current = null;
          lineSeriesRef.current = null;
        }
      };
    }
  }, []);

  // 在数据或图表模式改变时更新图表数据与显示
  useEffect(() => {
    if (data.length > 0 && chartRef.current) {
      // 对数据按时间戳进行排序
      const sortedData = [...data].sort((a, b) => a.time - b.time);

      // 准备蜡烛图数据
      const candleData: CandlestickData[] = sortedData.map(item => ({
        time: item.time,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      }));

      // 准备成交量数据
      const volumeData: HistogramData[] = sortedData.map(item => ({
        time: item.time,
        value: item.volume,
        color: item.close >= item.open ? 'rgba(1, 181, 116, 0.5)' : 'rgba(242, 54, 69, 0.5)',
      }));

      // 准备线图数据
      const lineData: LineData[] = sortedData.map(item => ({
        time: item.time,
        value: item.close,
      }));

      // 更新各个系列的数据
      if (candleSeriesRef.current) {
        candleSeriesRef.current.setData(candleData);
      }

      if (volumeSeriesRef.current) {
        volumeSeriesRef.current.setData(volumeData);
      }

      if (lineSeriesRef.current) {
        lineSeriesRef.current.setData(lineData);
      }

      // 根据视图模式显示/隐藏相应的系列
      switch (viewMode) {
        case 'candle':
          if (candleSeriesRef.current) candleSeriesRef.current.applyOptions({ visible: true });
          if (lineSeriesRef.current) lineSeriesRef.current.applyOptions({ visible: false });
          if (volumeSeriesRef.current) volumeSeriesRef.current.applyOptions({ visible: true });
          break;

        case 'line':
          if (candleSeriesRef.current) candleSeriesRef.current.applyOptions({ visible: false });
          if (lineSeriesRef.current) lineSeriesRef.current.applyOptions({ visible: true });
          if (volumeSeriesRef.current) volumeSeriesRef.current.applyOptions({ visible: false });
          break;

        case 'volume':
          if (candleSeriesRef.current) candleSeriesRef.current.applyOptions({ visible: false });
          if (lineSeriesRef.current) lineSeriesRef.current.applyOptions({ visible: false });
          if (volumeSeriesRef.current) volumeSeriesRef.current.applyOptions({ visible: true });
          break;
      }

      // 调整时间比例以显示所有数据
      chartRef.current.timeScale().fitContent();

      // 设置鼠标事件处理程序 - 在数据加载完成后才设置
      const crosshairMoveHandler = (param: MouseEventParams) => {
        if (!param.point || param.time === undefined) {
          // 如果鼠标移出图表区域或没有有效数据点，隐藏tooltip
          if (!chartContainerRef.current?.contains(document.activeElement)) {
            setTooltipVisible(false);
          }
          return;
        }

        // 获取对应的数据点
        const dataPoint = findDataPointByTime(param.time);

        if (dataPoint) {
          // 更新tooltip数据和位置
          setTooltipPoint(dataPoint);

          // 获取图表容器的位置信息
          const x = param.point.x;
          const y = param.point.y - 10; // 向上偏移一点，避免遮挡鼠标

          setTooltipPosition({ x, y });
          setTooltipVisible(true);
        } else {
          setTooltipVisible(false);
        }
      };

      chartRef.current.subscribeCrosshairMove(crosshairMoveHandler);

      // 鼠标离开图表区域时隐藏tooltip
      const handleMouseLeave = () => {
        setTooltipVisible(false);
      };

      chartContainerRef.current?.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        chartContainerRef.current?.removeEventListener('mouseleave', handleMouseLeave);
        chartRef.current?.unsubscribeCrosshairMove(crosshairMoveHandler);
      };
    }
  }, [data, viewMode]);

  // 处理图表模式切换的函数
  const toggleChartMode = (): void => {
    setViewMode(prev => {
      if (prev === 'candle') return 'line';
      if (prev === 'line') return 'volume';
      return 'candle';
    });
  };

  // 获取图表显示文本
  const getChartModeText = (): string => {
    switch (viewMode) {
      case 'candle':
        return '折线图';
      case 'line':
        return '成交量';
      default:
        return 'K线图';
    }
  };

  // 处理时间周期切换
  const handleTimeframeChange = (newTimeframe: '5m' | '15m' | '1h' | '4h' | '1d') => {
    setTimeframe(newTimeframe);
  };

  return (
    <div
      className="cyberpunk-card-base p-2 h-100 relative overflow-hidden"
      style={{
        backgroundColor: 'rgba(10, 11, 30, 0.9)',
        borderRadius: '12px',
        border: '1px solid #05d9e8',
        minHeight: '500px',
      }}
    >
      {/* Tooltip 组件 */}
      {tooltipVisible && tooltipPoint && (
        <ChartTooltip
          point={tooltipPoint}
          visible={tooltipVisible}
          x={tooltipPosition.x}
          y={tooltipPosition.y}
          baseSymbol={baseToken.symbol}
          quoteSymbol={quoteToken.symbol}
        />
      )}

      <div className="flex justify-between items-center mb-2">
        <h3
          className="cyberpunk-title text-xl"
          style={{
            background: 'linear-gradient(to right, #05d9e8, #c16ecf)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold',
          }}
        >
          YIDENG COIN
        </h3>
        <div className="flex space-x-2">
          {/* 时间周期选择按钮 */}
          <div className="flex space-x-1">
            {['5m', '15m', '1h', '4h', '1d'].map(tf => (
              <button
                key={tf}
                onClick={() => handleTimeframeChange(tf as any)}
                className={`text-xs px-2 py-1 rounded ${
                  timeframe === tf
                    ? 'bg-gray-700 text-neon-blue'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
                style={{ border: timeframe === tf ? '1px solid #05d9e8' : '1px solid #333' }}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* 图表类型切换按钮 */}
          <button
            onClick={toggleChartMode}
            className="text-xs bg-gray-800 px-2 py-1 rounded text-neon-blue hover:bg-gray-700"
            style={{ border: '1px solid #05d9e8' }}
          >
            {getChartModeText()}
          </button>
        </div>
      </div>

      <div className="text-xs text-gray-400 mb-2">
        <div className="flex justify-between">
          <span className="text-neon-blue">
            {currentDate} • ${currentPrice ? currentPrice.toFixed(5) : '0.00000'}
          </span>
          <span className="text-neon-green">
            24h:
            <span className={priceChange >= 0 ? 'text-green-400' : 'text-red-400'}>
              {priceChange >= 0 ? '+' : ''}
              {priceChange.toFixed(2)}%
            </span>
          </span>
        </div>
      </div>

      {/* 加载状态 */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="text-neon-blue">加载中...</div>
        </div>
      )}

      {/* 错误提示 */}
      {error && <div className="text-red-500 text-sm mb-2">错误: {error} (显示模拟数据)</div>}

      {/* 图表容器 */}
      <div
        ref={chartContainerRef}
        style={{
          backgroundColor: '#0a0b1e',
          borderRadius: '8px',
          height: '400px',
          width: '100%',
          position: 'relative', // 为了正确定位 tooltip
        }}
      />
    </div>
  );
};

export default YiDengCoinChart;
