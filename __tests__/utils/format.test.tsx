/**
 * 这是一个示例工具函数测试文件
 * 在真实项目中，你应该替换为实际的工具函数测试
 */

describe('Format utils', () => {
  // 假设有一个格式化数字函数
  const formatNumber = (num: number, decimals = 2): string => {
    return num.toFixed(decimals);
  };

  // 假设有一个格式化货币函数
  const formatCurrency = (amount: number, symbol = 'G'): string => {
    return `${symbol}${formatNumber(amount)}`;
  };

  // 假设有一个计算百分比变化的函数
  const calculatePercentChange = (oldValue: number, newValue: number): string => {
    const change = ((newValue - oldValue) / oldValue) * 100;
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  describe('formatNumber', () => {
    it('formats numbers with default 2 decimals', () => {
      expect(formatNumber(10)).toBe('10.00');
      expect(formatNumber(10.5)).toBe('10.50');
      expect(formatNumber(10.567)).toBe('10.57'); // 四舍五入
    });

    it('formats numbers with custom decimals', () => {
      expect(formatNumber(10, 0)).toBe('10');
      expect(formatNumber(10.5, 1)).toBe('10.5');
      expect(formatNumber(10.567, 3)).toBe('10.567');
    });
  });

  describe('formatCurrency', () => {
    it('formats currency with default symbol', () => {
      expect(formatCurrency(10)).toBe('G10.00');
      expect(formatCurrency(10.5)).toBe('G10.50');
    });

    it('formats currency with custom symbol', () => {
      expect(formatCurrency(10, '$')).toBe('$10.00');
      expect(formatCurrency(10.5, '¥')).toBe('¥10.50');
    });
  });

  describe('calculatePercentChange', () => {
    it('formats positive changes correctly', () => {
      expect(calculatePercentChange(100, 110)).toBe('+10.00%');
      expect(calculatePercentChange(50, 75)).toBe('+50.00%');
    });

    it('formats negative changes correctly', () => {
      expect(calculatePercentChange(100, 90)).toBe('-10.00%');
      expect(calculatePercentChange(50, 25)).toBe('-50.00%');
    });

    it('handles zero changes correctly', () => {
      expect(calculatePercentChange(100, 100)).toBe('+0.00%');
    });
  });
});
