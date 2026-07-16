export interface Analytics {
  track(event: string, properties?: Record<string, unknown>): Promise<void>;
}
export class ConsoleAnalytics implements Analytics {
  async track(event: string, properties: Record<string, unknown> = {}) {
    console.info(`[analytics] ${event}`, properties);
  }
}
export const analytics: Analytics = new ConsoleAnalytics();
