import { useMemo } from 'react';

export type TimeRange = '7d' | '30d' | '90d';
export type PlatformKey = 'TikTok' | 'Instagram' | 'YouTube' | 'Reels' | 'Twitch';

export interface DataPoint {
  value: number;
  date: string; // 'MMM D' formatted label
}

export interface PlatformSeries {
  platform: PlatformKey;
  color: string;
  views: DataPoint[];
  engagement: DataPoint[];
}

export interface AnalyticsSummary {
  totalViews: number;
  totalEngagements: number;
  followerGrowth: number;
}

const PLATFORM_COLORS: Record<PlatformKey, string> = {
  TikTok: '#69C9D0',
  Instagram: '#E1306C',
  YouTube: '#FF0000',
  Reels: '#833AB4',
  Twitch: '#9146FF',
};

function seed(platform: PlatformKey, day: number): number {
  // Deterministic "random" based on platform name and day index
  const s = platform.charCodeAt(0) + platform.charCodeAt(1) + day * 37;
  return ((s * 1103515245 + 12345) & 0x7fffffff) % 10000;
}

function buildSeries(platform: PlatformKey, days: number): PlatformSeries {
  const now = new Date(2026, 5, 16); // fixed date for determinism
  const views: DataPoint[] = [];
  const engagement: DataPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    views.push({ value: seed(platform, i) + 500, date: label });
    engagement.push({ value: Math.round((seed(platform, i + 100) / 10000) * 100) / 100, date: label });
  }

  return { platform, color: PLATFORM_COLORS[platform], views, engagement };
}

export function useAnalyticsData(range: TimeRange, activePlatforms: PlatformKey[]) {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;

  const series = useMemo<PlatformSeries[]>(
    () => activePlatforms.map((p) => buildSeries(p, days)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [range, activePlatforms.join(',')]
  );

  const summary = useMemo<AnalyticsSummary>(() => {
    let totalViews = 0;
    let totalEngagements = 0;
    for (const s of series) {
      totalViews += s.views.reduce((acc, d) => acc + d.value, 0);
      totalEngagements += s.engagement.reduce((acc, d) => acc + d.value, 0);
    }
    return { totalViews, totalEngagements, followerGrowth: Math.round(totalViews * 0.012) };
  }, [series]);

  return { series, summary };
}
