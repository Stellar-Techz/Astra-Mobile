import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CurationGrid } from '@/components/curation/curation-grid';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { SAMPLE_CLIPS } from '@/data/sample-clips';

export default function CurationScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.container, { backgroundColor: theme.background }]}>
      <ThemedView style={styles.header}>
        <ThemedText type="subtitle">Curation</ThemedText>
        <ThemedText themeColor="textSecondary">
          Tap a clip to preview it inline. Scroll away to pause playback.
        </ThemedText>
      </ThemedView>

      <CurationGrid clips={SAMPLE_CLIPS} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
});
