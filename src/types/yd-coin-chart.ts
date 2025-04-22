import { UTCTimestamp } from 'lightweight-charts';


// GeckoTerminal API 数据类型定义
export interface GeckoTerminalResponse {
  data: {
    attributes: {
      ohlcv_list: Array<[number, string, string, string, string, string]>;
    };
    id: string;
    type: string;
  };
  meta: {
    base: TokenInfo;
    quote: TokenInfo;
  };
}

// 代币信息类型
export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  coingecko_coin_id: string;
}

// 图表数据点类型
export interface CoinDataPoint {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartTooltipProps {
  point: CoinDataPoint | null;
  visible: boolean;
  x: number;
  y: number;
  baseSymbol?: string;
  quoteSymbol?: string;
}

