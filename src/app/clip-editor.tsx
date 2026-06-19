import { useEvent } from 'expo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useRef, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const TEAL = '#00C4B4';

// Demo source – replace with the actual clip URI passed via params
const DEMO_SOURCE =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

type Platform = 'TikTok' | 'Instagram' | 'YouTube';

const PLATFORMS: { key: Platform; label: string; format: string }[] = [
  { key: 'TikTok', label: 'TikTok', format: '9:16 · up to 60s' },
  { key: 'Instagram', label: 'Instagram', format: '9:16 · up to 90s' },
  { key: 'YouTube', label: 'YouTube', format: '9:16 · up to 60s' },
];

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ClipEditorScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams<{ clipId?: string; uri?: string; caption?: string }>();

  const videoSource = (params.uri as string) || DEMO_SOURCE;
  const initialCaption = params.caption || 'This clip is going viral 🔥 #shorts #trending';

  const player = useVideoPlayer(videoSource, (p) => {
    p.pause();
  });

  const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });

  const duration = player.duration || 60;
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(1); // 0–1 normalised
  const [platform, setPlatform] = useState<Platform>('TikTok');
  const [caption, setCaption] = useState(initialCaption);
  const [dirty, setDirty] = useState(false);

  const sliderWidth = useRef(0);

  function handleCaptionChange(text: string) {
    setCaption(text);
    setDirty(true);
  }

  function handleSave() {
    // Persist trim + caption here (e.g. update store / API)
    router.back();
  }

  function handleClose() {
    if (!dirty) {
      router.back();
      return;
    }
    Alert.alert('Discard changes?', 'Your edits will not be saved.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => router.back() },
    ]);
  }

  const currentPlatform = PLATFORMS.find((p) => p.key === platform)!;
  const startSec = trimStart * duration;
  const endSec = trimEnd * duration;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleClose} hitSlop={8} style={styles.headerBtn}>
            <ThemedText type="default">✕</ThemedText>
          </Pressable>
          <ThemedText type="smallBold">Clip Editor</ThemedText>
          <Pressable
            onPress={handleSave}
            hitSlop={8}
            style={[styles.headerBtn, styles.saveBtn]}
          >
            <ThemedText type="smallBold" style={{ color: '#000' }}>
              Save &amp; Return
            </ThemedText>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Video player */}
          <Pressable
            onPress={() => (isPlaying ? player.pause() : player.play())}
            style={[styles.videoContainer, { backgroundColor: '#000' }]}
          >
            <VideoView
              player={player}
              style={styles.video}
              contentFit="contain"
              nativeControls={false}
            />
            {!isPlaying && (
              <View style={styles.playOverlay} pointerEvents="none">
                <ThemedText style={styles.playIcon}>▶</ThemedText>
              </View>
            )}
          </Pressable>

          {/* Time display */}
          <View style={styles.timeRow}>
            <ThemedText type="small" themeColor="textSecondary">
              {fmt(startSec)}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {fmt(endSec)} / {fmt(duration)}
            </ThemedText>
          </View>

          {/* Trim slider track */}
          <View
            style={[styles.trimTrack, { backgroundColor: theme.backgroundElement }]}
            onLayout={(e) => {
              sliderWidth.current = e.nativeEvent.layout.width;
            }}
          >
            {/* Highlighted range */}
            <View
              style={[
                styles.trimRange,
                {
                  backgroundColor: TEAL,
                  left: `${trimStart * 100}%` as unknown as number,
                  width: `${(trimEnd - trimStart) * 100}%` as unknown as number,
                },
              ]}
            />
            {/* Start handle */}
            <Pressable
              style={[styles.trimHandle, { left: `${trimStart * 100}%` as unknown as number }]}
              onStartShouldSetResponder={() => true}
              onResponderMove={(e) => {
                if (!sliderWidth.current) return;
                const raw = e.nativeEvent.locationX / sliderWidth.current;
                const clamped = Math.max(0, Math.min(raw, trimEnd - 0.05));
                setTrimStart(clamped);
                setDirty(true);
                player.currentTime = clamped * duration;
              }}
            />
            {/* End handle */}
            <Pressable
              style={[styles.trimHandle, { left: `${trimEnd * 100}%` as unknown as number }]}
              onStartShouldSetResponder={() => true}
              onResponderMove={(e) => {
                if (!sliderWidth.current) return;
                const raw = e.nativeEvent.locationX / sliderWidth.current;
                const clamped = Math.max(trimStart + 0.05, Math.min(raw, 1));
                setTrimEnd(clamped);
                setDirty(true);
              }}
            />
          </View>

          {/* Platform tabs */}
          <View style={[styles.tabBar, { backgroundColor: theme.backgroundElement }]}>
            {PLATFORMS.map(({ key, label }) => (
              <Pressable
                key={key}
                style={[
                  styles.tab,
                  platform === key && { backgroundColor: TEAL, borderRadius: Spacing.two },
                ]}
                onPress={() => setPlatform(key)}
              >
                <ThemedText
                  type="small"
                  style={platform === key ? { color: '#000', fontWeight: '700' } : undefined}
                  themeColor={platform === key ? undefined : 'textSecondary'}
                >
                  {label}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <ThemedText type="small" themeColor="textSecondary" style={styles.formatLabel}>
            Export format: {currentPlatform.format}
          </ThemedText>

          {/* Caption */}
          <ThemedText type="smallBold" style={styles.captionLabel}>
            Caption
          </ThemedText>
          <TextInput
            value={caption}
            onChangeText={handleCaptionChange}
            multiline
            style={[
              styles.captionInput,
              {
                backgroundColor: theme.backgroundElement,
                color: theme.text,
                borderColor: dirty ? TEAL : 'transparent',
              },
            ]}
            placeholderTextColor={theme.textSecondary}
            placeholder="Add a caption…"
          />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  headerBtn: { minWidth: 32 },
  saveBtn: {
    backgroundColor: TEAL,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  scroll: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.five, gap: Spacing.three },
  videoContainer: {
    width: '100%',
    aspectRatio: 9 / 16,
    borderRadius: Spacing.three,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: { width: '100%', height: '100%' },
  playOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  playIcon: { fontSize: 48, color: '#fff' },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -Spacing.two,
  },
  trimTrack: {
    height: 28,
    borderRadius: Spacing.two,
    overflow: 'visible',
    position: 'relative',
    justifyContent: 'center',
  },
  trimRange: {
    position: 'absolute',
    height: '100%',
    borderRadius: Spacing.two,
  },
  trimHandle: {
    position: 'absolute',
    width: 16,
    height: 36,
    marginTop: -4,
    marginLeft: -8,
    backgroundColor: '#fff',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: TEAL,
    top: 0,
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: Spacing.two,
    padding: Spacing.half,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  formatLabel: { marginTop: -Spacing.two },
  captionLabel: { marginBottom: Spacing.one },
  captionInput: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1.5,
  },
});
