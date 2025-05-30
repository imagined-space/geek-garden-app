import React, { useState, useEffect } from 'react';
import { useWebVitals } from '@/hooks/useWebVitals';

interface WebVitalsMonitorProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showScore?: boolean;
  minimized?: boolean;
  debug?: boolean;
}

export const WebVitalsMonitor: React.FC<WebVitalsMonitorProps> = ({
  position = 'bottom-right',
  showScore = true,
  minimized: initialMinimized = false,
  debug = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [minimized, setMinimized] = useState(initialMinimized);

  const { metrics, performanceScore, isLoading, getMetricStatus } = useWebVitals({
    reportToAnalytics: true,
    debug,
  });

  // 键盘快捷键：Ctrl+Shift+V
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'V') {
        setIsVisible(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!isVisible) return null;

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-400';
      case 'needs-improvement':
        return 'text-yellow-400';
      case 'poor':
        return 'text-red-400';
      case 'loading':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 75) return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatValue = (metricName: string, value: number | null) => {
    if (value === null) return '...';
    if (metricName === 'CLS') return value.toFixed(3);
    return `${Math.round(value)}ms`;
  };

  return (
    <div
      className={`fixed ${positionClasses[position]} z-50 bg-black bg-opacity-90 text-white rounded-lg border border-neon-blue transition-all duration-300 ${
        minimized ? 'w-16 h-16' : 'w-80 max-h-96'
      }`}
    >
      {minimized ? (
        <button
          onClick={() => setMinimized(false)}
          className="w-full h-full flex items-center justify-center text-neon-blue hover:text-neon-pink transition-colors"
          title="Web Vitals Monitor"
        >
          📊
        </button>
      ) : (
        <div className="p-4">
          {/* 头部 */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-neon-blue">Web Vitals</h3>
            <div className="flex items-center space-x-2">
              {showScore && (
                <div className={`text-lg font-bold ${getScoreColor(performanceScore)}`}>
                  {isLoading ? '...' : performanceScore}
                </div>
              )}
              <button onClick={() => setMinimized(true)} className="text-gray-400 hover:text-white">
                −
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>

          {/* 指标列表 */}
          <div className="space-y-3 text-sm font-mono">
            {Object.entries(metrics).map(([metricName, value]) => {
              const status = getMetricStatus(metricName as keyof typeof metrics, value);
              return (
                <div key={metricName} className="flex justify-between items-center">
                  <span className="text-gray-300">{metricName}:</span>
                  <span className={getStatusColor(status)}>{formatValue(metricName, value)}</span>
                </div>
              );
            })}
          </div>

          {/* 性能评级 */}
          {showScore && (
            <div className="mt-4 pt-3 border-t border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Performance Score:</span>
                <span className={`text-lg font-bold ${getScoreColor(performanceScore)}`}>
                  {isLoading ? 'Loading...' : `${performanceScore}/100`}
                </span>
              </div>
            </div>
          )}

          {/* 帮助信息 */}
          <div className="mt-3 text-xs text-gray-400 border-t border-gray-700 pt-2">
            <div>Press Ctrl+Shift+V to toggle</div>
            <div className="mt-1">
              <span className="text-green-400">●</span> Good |{' '}
              <span className="text-yellow-400">●</span> Needs Work |{' '}
              <span className="text-red-400">●</span> Poor
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
