import { UTCTimestamp } from 'lightweight-charts';

// GeckoTerminal API 数据类型
export interface GeckoTerminalCandle {
  timestamp: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

// GeckoTerminal API 数据类型定义
export interface GeckoTerminalResponse {
  data: {
    id: string;
    type: string;
    attributes: {
      ohlcv_list: Array<[number, string, string, string, string, string]>;
    };
  };
  meta: {
    // 基础代币信息（包括地址、名称、符号和 CoinGecko ID）
    base: {
      address: string;
      name: string;
      symbol: string;
      coingecko_coin_id: string;
    };
    // 报价代币信息（包括地址、名称、符号和 CoinGecko ID）
    quote: {
      address: string;
      name: string;
      symbol: string;
      coingecko_coin_id: string;
    };
  };
}

// 图表数据点类型
export interface CoinDataPoint {
  time: UTCTimestamp; //时间戳（毫秒）
  open: number; // 开盘价
  high: number; // 最高价
  low: number; // 最低价
  close: number; // 收盘价
  volume: number; // 成交量
}

// 鼠标事件类型
export interface ChartMouseEvent {
  point: {
    x: number;
    y: number;
  };
  time: UTCTimestamp;
  price: number;
  seriesPrices: Map<any, number>;
}

export interface ChartTooltipProps {
  point: CoinDataPoint | null;
  visible: boolean;
  x: number;
  y: number;
  baseSymbol?: string;
  quoteSymbol?: string;
}
