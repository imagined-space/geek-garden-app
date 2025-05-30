import { Metric } from 'web-vitals';

interface MetricData extends Omit<Metric, 'entries'> {
  timestamp: number;
  sessionId: string;
  pageUrl: string;
}

export class WebVitalsReporter {
  private endpoint: string;

  private batchSize: number;

  private buffer: MetricData[] = [];

  constructor(endpoint: string, batchSize = 10) {
    this.endpoint = endpoint;
    this.batchSize = batchSize;
  }

  async report(metric: Metric): Promise<void> {
    this.buffer.push({
      ...metric,
      timestamp: Date.now(),
      sessionId: WebVitalsReporter.getSessionId(),
      pageUrl: window.location.href,
    });

    if (this.buffer.length >= this.batchSize) {
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics: this.buffer }),
      });
      this.buffer = [];
    } catch (error) {
      // Silently handle the error or use a proper logging service
      // In development, you might want to enable logging
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to report Web Vitals:', error);
      }
    }
  }

  private static getSessionId(): string {
    let sessionId = sessionStorage.getItem('webVitalsSessionId');
    if (!sessionId) {
      sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      sessionStorage.setItem('webVitalsSessionId', sessionId);
    }
    return sessionId;
  }

  // 公开方法用于手动刷新缓冲区
  public async flushBuffer(): Promise<void> {
    await this.flush();
  }

  // 获取当前缓冲区大小
  public getBufferSize(): number {
    return this.buffer.length;
  }
}

// 导出类型以供其他模块使用
export type { MetricData };

// 命名导出避免匿名默认导出
export const webVitalsUtils = {
  WebVitalsReporter,
} as const;

export default webVitalsUtils;
