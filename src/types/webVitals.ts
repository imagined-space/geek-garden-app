export interface WebVitalsMetrics {
  CLS: number | null; // Cumulative Layout Shift
  FCP: number | null; // First Contentful Paint
  LCP: number | null; // Largest Contentful Paint
  TTFB: number | null; // Time to First Byte
  INP: number | null; // Interaction to Next Paint (新指标)
}

export interface VitalsThresholds {
  CLS: { good: number; needsImprovement: number };
  FCP: { good: number; needsImprovement: number };
  LCP: { good: number; needsImprovement: number };
  TTFB: { good: number; needsImprovement: number };
  INP: { good: number; needsImprovement: number };
}

export interface PerformanceReport {
  timestamp: number;
  url: string;
  userAgent: string;
  metrics: WebVitalsMetrics;
  deviceInfo: {
    memory?: number;
    connection?: string;
    devicePixelRatio: number;
  };
  customMetrics?: {
    particleRenderTime?: number;
    chartRenderTime?: number;
    web3LoadTime?: number;
  };
}
