import { SymbolView } from 'expo-symbols';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useJobProgress, type JobProgress } from '@/hooks/use-job-progress';
import { useTheme } from '@/hooks/use-theme';

// ─── Stages ──────────────────────────────────────────────────────────────────

const STAGES = ['Uploading', 'Analyzing video clips', 'Generating clips', 'Finalizing'] as const;

function stageFromProgress(progress: number): string {
  if (progress < 20) return STAGES[0];
  if (progress < 55) return STAGES[1];
  if (progress < 85) return STAGES[2];
  return STAGES[3];
}

function formatEta(seconds: number): string {
  if (seconds < 60) return `${Math.ceil(seconds)}s remaining`;
  return `~${Math.ceil(seconds / 60)} min remaining`;
}

// ─── API plumbing (replace WS_URL with real value) ───────────────────────────

const WS_URL = process.env.EXPO_PUBLIC_API_WS_URL ?? 'ws://localhost:3000';

async function fetchJobProgress(jobId: string): Promise<JobProgress> {
  const res = await fetch(`${WS_URL.replace(/^ws/, 'http')}/jobs/${jobId}/progress`);
  if (!res.ok) throw new Error('poll failed');
  return res.json() as Promise<JobProgress>;
}

// ─── Sparkle icon with pulse + rotation ──────────────────────────────────────

function SparkleIcon({ isError }: { isError: boolean }) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isError) return;
    rotation.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, [isError]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.iconWrap, animStyle]}>
      <SymbolView
        name={isError ? 'exclamationmark.triangle.fill' : 'sparkles'}
        size={56}
        tintColor={isError ? '#ef4444' : '#00BFA5'}
      />
    </Animated.View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ProcessingScreen() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const router = useRouter();
  const theme = useTheme();

  const { progress, status, estimatedSeconds, connectionState } =
    useJobProgress(jobId ?? null, WS_URL, fetchJobProgress);

  const isError = connectionState === 'error';

  // Derive stage label from progress unless there's a meaningful server status
  const stageLabel = isError ? 'Something went wrong' : stageFromProgress(progress);

  // Animated progress bar width
  const barWidth = useSharedValue(0);
  useEffect(() => {
    barWidth.value = withTiming(progress, { duration: 500, easing: Easing.out(Easing.quad) });
  }, [progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${barWidth.value}%`,
  }));

  function handleCancel() {
    Alert.alert(
      'Cancel Processing?',
      'Your upload will be discarded and you will return to the upload screen.',
      [
        { text: 'Keep Processing', style: 'cancel' },
        {
          text: 'Cancel',
          style: 'destructive',
          onPress: () => router.replace('/(tabs)/upload'),
        },
      ],
    );
  }

  function handleRetry() {
    router.replace({ pathname: '/processing', params: { jobId } });
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.card} type="backgroundElement">
          {/* Animated sparkle / error icon */}
          <SparkleIcon isError={isError} />

          {/* Stage label */}
          <ThemedText type="subtitle" style={styles.centered}>
            {isError ? 'Processing failed' : 'Processing with AI'}
          </ThemedText>

          <ThemedText themeColor="textSecondary" style={styles.centered}>
            {stageLabel}
          </ThemedText>

          {/* Progress bar */}
          <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
            <Animated.View
              style={[styles.fill, barStyle, { backgroundColor: '#00BFA5' }]}
            />
          </View>

          {/* Progress % and ETA */}
          <ThemedText type="small" themeColor="textSecondary" style={styles.centered}>
            {progress}%
            {estimatedSeconds != null && estimatedSeconds > 0
              ? `  ·  ${formatEta(estimatedSeconds)}`
              : null}
          </ThemedText>

          {/* Error retry */}
          {isError && (
            <Pressable style={styles.retryButton} onPress={handleRetry}>
              <ThemedText style={styles.retryText}>Retry</ThemedText>
            </Pressable>
          )}

          {/* Privacy notice */}
          <ThemedText type="small" themeColor="textSecondary" style={styles.privacy}>
            🔒 Your footage is secured and encrypted during processing.
          </ThemedText>

          {/* Cancel */}
          {!isError && (
            <Pressable onPress={handleCancel} style={styles.cancelButton}>
              <ThemedText type="small" themeColor="textSecondary">
                Cancel Processing
              </ThemedText>
            </Pressable>
          )}
        </ThemedView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  card: {
    width: '100%',
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.three,
    alignItems: 'center',
  },
  iconWrap: {
    marginBottom: Spacing.one,
  },
  centered: {
    textAlign: 'center',
  },
  track: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
  privacy: {
    textAlign: 'center',
    opacity: 0.7,
    marginTop: Spacing.one,
  },
  cancelButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  retryButton: {
    backgroundColor: '#00BFA5',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
});
