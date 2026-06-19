import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const TEAL = '#00C4B4';

type Tab = 'all' | 'viral' | 'recent';

interface Clip {
  id: string;
  thumbnail: string;
  duration: string;
  score: number;
  createdAt: number;
}

const CLIPS: Clip[] = [
  { id: '1', thumbnail: '', duration: '0:45', score: 98, createdAt: 5 },
  { id: '2', thumbnail: '', duration: '0:32', score: 87, createdAt: 4 },
  { id: '3', thumbnail: '', duration: '1:00', score: 91, createdAt: 3 },
  { id: '4', thumbnail: '', duration: '0:18', score: 72, createdAt: 2 },
  { id: '5', thumbnail: '', duration: '0:55', score: 65, createdAt: 1 },
  { id: '6', thumbnail: '', duration: '0:27', score: 83, createdAt: 6 },
];

const TOP_CLIP_ID = CLIPS.reduce((a, b) => (a.score > b.score ? a : b)).id;

function filterClips(clips: Clip[], tab: Tab): Clip[] {
  if (tab === 'viral') return clips.filter((c) => c.score >= 80);
  if (tab === 'recent') return [...clips].sort((a, b) => b.createdAt - a.createdAt);
  return clips;
}

export default function CurationScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<Tab>('all');

  const visible = useMemo(() => filterClips(CLIPS, tab), [tab]);
  const allSelected = visible.length > 0 && visible.every((c) => selected.has(c.id));

  function toggleClip(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        visible.forEach((c) => next.delete(c.id));
        return next;
      });
    } else {
      setSelected((prev) => new Set([...prev, ...visible.map((c) => c.id)]));
    }
  }

  const selectedCount = [...selected].filter((id) => visible.some((c) => c.id === id)).length;

  const TABS: { key: Tab; label: string }[] = [
    { key: 'all', label: 'All Clips' },
    { key: 'viral', label: 'High Virality' },
    { key: 'recent', label: 'Recent' },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="subtitle">Your Clips</ThemedText>
          <Pressable onPress={toggleSelectAll}>
            <ThemedText type="small" style={{ color: TEAL }}>
              {allSelected ? 'Deselect All' : 'Select All'}
            </ThemedText>
          </Pressable>
        </View>

        {/* Tab bar */}
        <View style={[styles.tabBar, { backgroundColor: theme.backgroundElement }]}>
          {TABS.map(({ key, label }) => (
            <Pressable
              key={key}
              style={[styles.tab, tab === key && { backgroundColor: TEAL, borderRadius: Spacing.two }]}
              onPress={() => setTab(key)}
            >
              <ThemedText
                type="small"
                style={tab === key ? styles.activeTabText : undefined}
                themeColor={tab === key ? undefined : 'textSecondary'}
              >
                {label}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {/* Grid */}
        <FlatList
          data={visible}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => {
            const isSelected = selected.has(item.id);
            const isTop = item.id === TOP_CLIP_ID;
            return (
              <Pressable
                style={[
                  styles.card,
                  { backgroundColor: theme.backgroundElement },
                  isSelected && styles.cardSelected,
                ]}
                onPress={() =>
                  router.push({
                    pathname: '/clip-editor',
                    params: {
                      clipId: item.id,
                      caption: `Clip #${item.id} — ${item.duration} 🔥 #shorts #trending`,
                    },
                  })
                }
                onLongPress={() => toggleClip(item.id)}
              >
                {/* Thumbnail placeholder */}
                <View style={[styles.thumbnail, { backgroundColor: theme.backgroundSelected }]}>
                  {isTop && (
                    <View style={styles.viralBadge}>
                      <ThemedText type="code" style={styles.viralBadgeText}>
                        VIRAL POTENTIAL
                      </ThemedText>
                    </View>
                  )}
                  {isSelected && (
                    <View style={styles.checkOverlay}>
                      <ThemedText style={styles.checkmark}>✓</ThemedText>
                    </View>
                  )}
                </View>
                <View style={styles.cardInfo}>
                  <ThemedText type="small">{item.duration}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Score: {item.score}
                  </ThemedText>
                </View>
              </Pressable>
            );
          }}
        />

        {/* Bottom bar */}
        <View style={[styles.bottomBar, { borderTopColor: theme.backgroundElement }]}>
          {selectedCount > 0 && (
            <ThemedText type="small" themeColor="textSecondary">
              {selectedCount} selected
            </ThemedText>
          )}
          <Pressable
            style={[
              styles.postBtn,
              { backgroundColor: selectedCount > 0 ? TEAL : theme.backgroundElement },
            ]}
            disabled={selectedCount === 0}
            onPress={() => router.push('/')}
          >
            <ThemedText
              type="smallBold"
              style={{ color: selectedCount > 0 ? '#000' : theme.textSecondary }}
            >
              Post Selected Clips
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.four,
    borderRadius: Spacing.two,
    padding: Spacing.half,
    marginBottom: Spacing.three,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  activeTabText: { color: '#000', fontWeight: '700' },
  grid: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.two,
  },
  row: { gap: Spacing.two },
  card: {
    flex: 1,
    borderRadius: Spacing.three,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: { borderColor: TEAL },
  thumbnail: {
    aspectRatio: 9 / 16,
    justifyContent: 'flex-end',
  },
  viralBadge: {
    position: 'absolute',
    top: Spacing.two,
    left: Spacing.two,
    backgroundColor: TEAL,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Spacing.one,
  },
  viralBadgeText: { color: '#000', fontWeight: '700' },
  checkOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,196,180,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: { fontSize: 32, color: '#fff', fontWeight: '700' },
  cardInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.two,
  },
  bottomBar: {
    borderTopWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
  },
  postBtn: {
    paddingVertical: Spacing.two + 4,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
});
