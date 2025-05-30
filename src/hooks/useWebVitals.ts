import { useState, useEffect, useCallback } from 'react';
import { onCLS, onFCP, onLCP, onTTFB, onINP, Metric } from 'web-vitals';
import { WebVitalsMetrics, VitalsThresholds, PerformanceReport } from '@/types/webVitals';

// Type declaration for gtag function
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// Google 推荐的阈值
const DEFAULT_THRESHOLDS: VitalsThresholds = {
  CLS: { good: 0.1, needsImprovement: 0.25 },
  FCP: { good: 1800, needsImprovement: 3000 },
  LCP: { good: 2500, needsImprovement: 4000 },
  TTFB: { good: 800, needsImprovement: 1800 },
  INP: { good: 200, needsImprovement: 500 },
};

interface UseWebVitalsOptions {
  reportToAnalytics?: boolean;
  reportEndpoint?: string;
  debug?: boolean;
  thresholds?: Partial<VitalsThresholds>;
}

export const useWebVitals = (options: UseWebVitalsOptions = {}) => {
  const {
    reportToAnalytics = false,
    reportEndpoint,
    debug = false,
    thresholds = DEFAULT_THRESHOLDS,
  } = options;

  const [metrics, setMetrics] = useState<WebVitalsMetrics>({
    CLS: null,
    FCP: null,
    LCP: null,
    TTFB: null,
    INP: null,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [performanceScore, setPerformanceScore] = useState<number>(0);

  // 计算性能评分
  const calculatePerformanceScore = useCallback(
    (metricsData: WebVitalsMetrics): number => {
      const scores: number[] = [];

      Object.entries(metricsData).forEach(([key, value]) => {
        if (value !== null) {
          const threshold = thresholds[key as keyof VitalsThresholds];
          if (threshold) {
            if (value <= threshold.good) {
              scores.push(100);
            } else if (value <= threshold.needsImprovement) {
              scores.push(75);
            } else {
              scores.push(25);
            }
          }
        }
      });

      return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    },
    [thresholds],
  );

  // 发送指标到分析服务
  const sendToAnalytics = useCallback(
    async (metric: Metric) => {
      if (!reportToAnalytics) return;

      const data = {
        name: metric.name,
        value: metric.value,
        id: metric.id,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      };

      if (debug) {
        console.log('📊 Web Vitals Metric:', data);
      }

      // 发送到自定义端点
      if (reportEndpoint) {
        try {
          await fetch(reportEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
        } catch (error) {
          // Silently handle the error or use a proper logging service
          if (debug) {
            console.error(`Failed to send metrics: ${error}`);
          }
        }
      }

      // 发送到 Google Analytics (如果可用)
      if (typeof window.gtag !== 'undefined') {
        window.gtag('event', metric.name, {
          event_category: 'Web Vitals',
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          event_label: metric.id,
          non_interaction: true,
        });
      }
    },
    [reportToAnalytics, reportEndpoint, debug],
  );

  // 处理指标更新
  const handleMetric = useCallback(
    (metric: Metric) => {
      const metricName = metric.name as keyof WebVitalsMetrics;

      setMetrics(prev => {
        const updated = { ...prev, [metricName]: metric.value };
        const score = calculatePerformanceScore(updated);
        setPerformanceScore(score);

        if (debug) {
          console.log(`🎯 ${metricName}: ${metric.value}${metricName === 'CLS' ? '' : 'ms'}`);
        }

        return updated;
      });

      sendToAnalytics(metric);
    },
    [calculatePerformanceScore, sendToAnalytics, debug],
  );

  // 初始化 Web Vitals 监听
  useEffect(() => {
    // 监听所有 Core Web Vitals
    onCLS(handleMetric);
    onFCP(handleMetric);
    onLCP(handleMetric);
    onTTFB(handleMetric);
    onINP(handleMetric);

    // 标记加载完成
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [handleMetric]);

  // 获取指标状态
  const getMetricStatus = useCallback(
    (metricName: keyof WebVitalsMetrics, value: number | null) => {
      if (value === null) return 'loading';

      const threshold = thresholds[metricName];
      if (!threshold) return 'unknown';

      if (value <= threshold.good) return 'good';
      if (value <= threshold.needsImprovement) return 'needs-improvement';
      return 'poor';
    },
    [thresholds],
  );

  // 生成性能报告
  const generateReport = useCallback((): PerformanceReport => {
    const { connection } = navigator as Navigator & { connection?: { effectiveType: string } };
    const { memory } = performance as Performance & { memory?: { usedJSHeapSize: number } };

    return {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics,
      deviceInfo: {
        memory: memory?.usedJSHeapSize,
        connection: connection?.effectiveType,
        devicePixelRatio: window.devicePixelRatio,
      },
    };
  }, [metrics]);

  return {
    metrics,
    performanceScore,
    isLoading,
    getMetricStatus,
    generateReport,
    thresholds,
  };
};
