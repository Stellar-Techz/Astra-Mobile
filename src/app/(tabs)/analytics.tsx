/**
 * Analytics Screen — src/app/(tabs)/analytics.tsx
 *
 * Chart library: react-native-gifted-charts
 * Chosen over victory-native because:
 *  - No Skia dependency (lighter bundle, works on low-end Android without GPU overdraw)
 *  - Built-in tooltip support via pointerConfig
 *  - Satisfactory performance via pure RN (no extra native modules beyond gesture-handler)
 */

import { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-gifted-charts';

import {
  useAnalyticsData,
  type TimeRange,
  type PlatformKey,
} from '@/hooks/use-analytics-data';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

const PLATFORMS: PlatformKey[] = ['TikTok', 'Instagram', 'YouTube', 'Reels', 'Twitch'];
const RANGES: TimeRange[] = ['7d', '30d', '90d'];

export default function AnalyticsScreen() {
  const theme = useTheme();
  const [range, setRange] = useState<TimeRange>('30d');
  const [activePlatforms, setActivePlatforms] = useState<PlatformKey[]>([
    'TikTok',
    'Instagram',
    'YouTube',
  ]);

  const { series, summary } = useAnalyticsData(range, activePlatforms);

  const togglePlatform = useCallback((p: PlatformKey) => {
    setActivePlatforms((prev) =>
      prev.includes(p) ? (prev.length > 1 ? prev.filter((x) => x !== p) : prev) : [...prev, p]
    );
  }, []);

  // Build dataset for gifted-charts (each platform is a separate dataSet entry)
  const chartDataSets = series.map((s) =>
    s.views.map((d) => ({ value: d.value, label: d.date, dataPointText: d.date }))
  );
  const chartColors = series.map((s) => s.color);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        // removeClippedSubviews improves scroll perf on low-end Android
        removeClippedSubviews>
        {/* Title */}
        <Text style={[styles.title, { color: theme.text }]}>Analytics</Text>

        {/* Time range picker */}
        <View style={[styles.pill, { backgroundColor: theme.backgroundElement }]}>
          {RANGES.map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setRange(r)}
              style={[
                styles.pillItem,
                range === r && { backgroundColor: theme.backgroundSelected },
              ]}>
              <Text style={[styles.pillText, { color: range === r ? theme.text : theme.textSecondary }]}>
                {r}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary stat cards */}
        <View style={styles.cards}>
          <StatCard label="Total Views" value={fmt(summary.totalViews)} theme={theme} />
          <StatCard label="Engagements" value={fmt(summary.totalEngagements)} theme={theme} />
          <StatCard label="Follower Growth" value={`+${fmt(summary.followerGrowth)}`} theme={theme} />
        </View>

        {/* Platform filter */}
        <View style={styles.platformRow}>
          {PLATFORMS.map((p) => {
            const active = activePlatforms.includes(p);
            const color = series.find((s) => s.platform === p)?.color ?? theme.textSecondary;
            return (
              <TouchableOpacity
                key={p}
                onPress={() => togglePlatform(p)}
                style={[
                  styles.platformChip,
                  { backgroundColor: theme.backgroundElement, borderColor: active ? color : 'transparent', borderWidth: 1.5 },
                ]}>
                <View style={[styles.dot, { backgroundColor: color }]} />
                <Text style={[styles.chipText, { color: active ? theme.text : theme.textSecondary }]}>
                  {p}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Line chart */}
        {chartDataSets.length > 0 && (
          <View style={[styles.chartContainer, { backgroundColor: theme.backgroundElement }]}>
            <Text style={[styles.chartLabel, { color: theme.textSecondary }]}>Views</Text>
            <LineChart
              // Multiple lines via dataSet prop
              dataSet={chartDataSets.map((data, i) => ({
                data,
                color: chartColors[i],
                thickness: 2,
              }))}
              // Tooltip on tap — gifted-charts built-in pointer config
              pointerConfig={{
                activatePointersOnLongPress: false,
                pointerStripColor: theme.textSecondary,
                pointerColor: theme.text,
                radius: 4,
                pointerLabelComponent: (items: Array<{ value: number; label?: string }>) => {
                  const item = items[0];
                  if (!item) return null;
                  return (
                    <View style={[styles.tooltip, { backgroundColor: theme.backgroundSelected }]}>
                      <Text style={[styles.tooltipDate, { color: theme.textSecondary }]}>
                        {item.label ?? ''}
                      </Text>
                      {items.map((it, i) => (
                        <Text key={i} style={[styles.tooltipValue, { color: chartColors[i] ?? theme.text }]}>
                          {fmt(it.value)}
                        </Text>
                      ))}
                    </View>
                  );
                },
              }}
              // Appearance
              xAxisColor={theme.backgroundSelected}
              yAxisColor={theme.backgroundSelected}
              xAxisLabelTextStyle={{ color: theme.textSecondary, fontSize: 9 }}
              yAxisTextStyle={{ color: theme.textSecondary, fontSize: 9 }}
              hideDataPoints={range !== '7d'}
              spacing={range === '90d' ? 6 : range === '30d' ? 16 : 42}
              initialSpacing={10}
              yAxisOffset={0}
              noOfSections={4}
              rulesColor={theme.backgroundSelected}
              backgroundColor={theme.backgroundElement}
              width={320}
              height={200}
            />
          </View>
        )}

        {/* Legend */}
        <View style={styles.legend}>
          {series.map((s) => (
            <View key={s.platform} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: s.color }]} />
              <Text style={[styles.chipText, { color: theme.textSecondary }]}>{s.platform}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function StatCard({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <Text style={[styles.cardValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  title: { fontSize: 24, fontWeight: '700' },
  pill: {
    flexDirection: 'row',
    borderRadius: Spacing.three,
    padding: 3,
    alignSelf: 'flex-start',
    gap: 2,
  },
  pillItem: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
  },
  pillText: { fontSize: 13, fontWeight: '600' },
  cards: { flexDirection: 'row', gap: Spacing.two },
  card: {
    flex: 1,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: 2,
  },
  cardValue: { fontSize: 20, fontWeight: '700' },
  cardLabel: { fontSize: 11 },
  platformRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  platformChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontSize: 12 },
  chartContainer: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    overflow: 'hidden',
  },
  chartLabel: { fontSize: 11, marginBottom: Spacing.two },
  tooltip: {
    padding: Spacing.two,
    borderRadius: Spacing.two,
    minWidth: 60,
    alignItems: 'center',
  },
  tooltipDate: { fontSize: 10 },
  tooltipValue: { fontSize: 13, fontWeight: '700' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
});
