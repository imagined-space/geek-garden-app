import React, { useState } from 'react';
import { useWebVitals } from '@/hooks/useWebVitals';

export const WebVitalsDashboard: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { metrics, performanceScore, generateReport, thresholds } = useWebVitals({
    reportToAnalytics: true,
    debug: true,
  });

  const downloadReport = () => {
    const report = generateReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `web-vitals-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getRecommendation = (metricName: string, value: number | null) => {
    if (value === null) return '';

    const recommendations: Record<string, string> = {
      LCP: value > 2500 ? '优化图片加载、减少服务器响应时间' : '',
      CLS: value > 0.1 ? '为图片添加尺寸、避免动态插入内容' : '',
      FCP: value > 1800 ? '优化关键渲染路径、减少阻塞资源' : '',
      TTFB: value > 800 ? '优化服务器响应、使用 CDN' : '',
      INP: value > 200 ? '优化交互响应、减少主线程阻塞' : '',
    };

    return recommendations[metricName] || '';
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 bg-neon-blue text-black px-4 py-2 rounded-lg font-bold hover:bg-neon-pink transition-colors z-50"
      >
        📊 Web Vitals
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-dark-bg border border-neon-blue rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-neon-blue">Web Vitals Dashboard</h2>
          <div className="flex items-center space-x-4">
            <div className="text-lg">
              Score:{' '}
              <span
                className={`font-bold ${performanceScore >= 90 ? 'text-green-400' : performanceScore >= 75 ? 'text-yellow-400' : 'text-red-400'}`}
              >
                {performanceScore}/100
              </span>
            </div>
            <button
              onClick={downloadReport}
              className="bg-neon-blue text-black px-3 py-1 rounded hover:bg-neon-pink transition-colors"
            >
              Download Report
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white text-xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 指标详情 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(metrics).map(([metricName, value]) => {
            const threshold = thresholds[metricName as keyof typeof thresholds];
            const recommendation = getRecommendation(metricName, value);

            // 防御性检查 threshold 是否存在
            if (!threshold) {
              return null;
            }

            return (
              <div key={metricName} className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-2">{metricName}</h3>
                <div className="text-2xl font-bold mb-2">
                  {value === null ? (
                    <span className="text-gray-400">Loading...</span>
                  ) : (
                    <span
                      className={
                        value <= threshold.good
                          ? 'text-green-400'
                          : value <= threshold.needsImprovement
                            ? 'text-yellow-400'
                            : 'text-red-400'
                      }
                    >
                      {metricName === 'CLS' ? value.toFixed(3) : `${Math.round(value)}ms`}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-400 mb-3">
                  Good: ≤{threshold.good}
                  {metricName === 'CLS' ? '' : 'ms'} | Poor: &gt;{threshold.needsImprovement}
                  {metricName === 'CLS' ? '' : 'ms'}
                </div>
                {recommendation && (
                  <div className="text-xs text-yellow-300 bg-yellow-900 bg-opacity-20 p-2 rounded">
                    💡 {recommendation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Geek Garden 特定建议 */}
        <div className="mt-6 bg-gray-900 p-4 rounded-lg border border-neon-blue">
          <h3 className="text-lg font-bold text-neon-blue mb-3">🚀 Geek Garden 特定优化建议</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-bold text-neon-pink mb-2">3D 粒子效果优化:</h4>
              <ul className="text-gray-300 space-y-1">
                <li>• 根据设备性能动态调整粒子数量</li>
                <li>• 使用 Web Worker 进行粒子计算</li>
                <li>• 实现 LOD (细节层次) 系统</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-neon-pink mb-2">Web3 集成优化:</h4>
              <ul className="text-gray-300 space-y-1">
                <li>• 懒加载钱包连接组件</li>
                <li>• 缓存区块链数据请求</li>
                <li>• 优化智能合约调用</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
