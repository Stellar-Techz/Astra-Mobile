import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const TOTAL_STEPS = 4;

type Niche = 'Gamer' | 'Vlogger' | 'Tech Reviewer' | 'Artist';
type Channel = 'YouTube' | 'Twitch' | 'TikTok';

interface OnboardingState {
  username: string;
  niche: Niche | null;
  channels: Partial<Record<Channel, string>>;
  notificationsEnabled: boolean;
}

const NICHES: Niche[] = ['Gamer', 'Vlogger', 'Tech Reviewer', 'Artist'];
const CHANNELS: Channel[] = ['YouTube', 'Twitch', 'TikTok'];

const TEAL = '#00C4B4';

export default function OnboardingScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<OnboardingState>({
    username: '',
    niche: null,
    channels: {},
    notificationsEnabled: false,
  });

  function goBack() {
    if (step > 1) setStep(step - 1);
  }

  function goNext() {
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    } else {
      // Final step: save profile and navigate home
      router.replace('/');
    }
  }

  const inputStyle = [
    styles.input,
    { backgroundColor: theme.backgroundElement, color: theme.text, borderColor: theme.backgroundSelected },
  ];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="small" themeColor="textSecondary">
            STEP {step} / {TOTAL_STEPS}
          </ThemedText>
          <View style={[styles.progressTrack, { backgroundColor: theme.backgroundElement }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${(step / TOTAL_STEPS) * 100}%`, backgroundColor: TEAL },
              ]}
            />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {step === 1 && (
            <View style={styles.stepContainer}>
              <ThemedText type="subtitle">Choose your username</ThemedText>
              <ThemedText themeColor="textSecondary">
                This is how other creators will find you.
              </ThemedText>
              <TextInput
                style={inputStyle}
                placeholder="@username"
                placeholderTextColor={theme.textSecondary}
                value={state.username}
                onChangeText={(text) => setState((s) => ({ ...s, username: text }))}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContainer}>
              <ThemedText type="subtitle">Pick your niche</ThemedText>
              <ThemedText themeColor="textSecondary">Select the type of content you create.</ThemedText>
              <View style={styles.nicheGrid}>
                {NICHES.map((niche) => {
                  const selected = state.niche === niche;
                  return (
                    <Pressable
                      key={niche}
                      style={[
                        styles.nicheCard,
                        { backgroundColor: theme.backgroundElement },
                        selected && { borderColor: TEAL, borderWidth: 2 },
                      ]}
                      onPress={() => setState((s) => ({ ...s, niche }))}
                    >
                      <ThemedText type="smallBold">{niche}</ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContainer}>
              <ThemedText type="subtitle">Link your channels</ThemedText>
              <ThemedText themeColor="textSecondary">
                Connect the platforms you post on.
              </ThemedText>
              {CHANNELS.map((channel) => (
                <View
                  key={channel}
                  style={[styles.channelRow, { backgroundColor: theme.backgroundElement }]}
                >
                  <ThemedText style={styles.channelLabel}>{channel}</ThemedText>
                  <TextInput
                    style={[styles.channelInput, { color: theme.text }]}
                    placeholder="Paste link or handle"
                    placeholderTextColor={theme.textSecondary}
                    value={state.channels[channel] ?? ''}
                    onChangeText={(text) =>
                      setState((s) => ({ ...s, channels: { ...s.channels, [channel]: text } }))
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <ThemedText style={[styles.addBtn, { color: TEAL }]}>+</ThemedText>
                </View>
              ))}
            </View>
          )}

          {step === 4 && (
            <View style={styles.stepContainer}>
              <ThemedText type="subtitle">Stay in the loop</ThemedText>
              <ThemedText themeColor="textSecondary">
                Get notified when your clips are ready and earnings update.
              </ThemedText>
              <Pressable
                style={[
                  styles.toggleRow,
                  { backgroundColor: theme.backgroundElement },
                ]}
                onPress={() =>
                  setState((s) => ({ ...s, notificationsEnabled: !s.notificationsEnabled }))
                }
              >
                <ThemedText>Enable notifications</ThemedText>
                <View
                  style={[
                    styles.toggle,
                    {
                      backgroundColor: state.notificationsEnabled ? TEAL : theme.backgroundSelected,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.toggleThumb,
                      state.notificationsEnabled && styles.toggleThumbOn,
                    ]}
                  />
                </View>
              </Pressable>
            </View>
          )}
        </ScrollView>

        {/* Navigation */}
        <View style={styles.nav}>
          {step > 1 ? (
            <Pressable
              style={[styles.backBtn, { borderColor: theme.backgroundSelected }]}
              onPress={goBack}
            >
              <ThemedText type="small">Back</ThemedText>
            </Pressable>
          ) : (
            <View />
          )}
          <Pressable
            style={[styles.continueBtn, { backgroundColor: TEAL }]}
            onPress={goNext}
          >
            <ThemedText type="smallBold" style={styles.continueBtnText}>
              {step === TOTAL_STEPS ? 'Get Started' : 'Continue'}
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: Spacing.four },
  header: { paddingTop: Spacing.four, gap: Spacing.two },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 2 },
  scrollContent: { paddingVertical: Spacing.four },
  stepContainer: { gap: Spacing.three },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 4,
    fontSize: 16,
    marginTop: Spacing.two,
  },
  nicheGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  nicheCard: {
    width: '47%',
    paddingVertical: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    gap: Spacing.two,
  },
  channelLabel: { width: 80, fontWeight: '600' },
  channelInput: { flex: 1, fontSize: 14 },
  addBtn: { fontSize: 24, lineHeight: 28, fontWeight: '700' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    marginTop: Spacing.two,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.dark.text,
  },
  toggleThumbOn: { alignSelf: 'flex-end' },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.four,
    gap: Spacing.three,
  },
  backBtn: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two + 4,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  continueBtn: {
    flex: 1,
    paddingVertical: Spacing.two + 4,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  continueBtnText: { color: '#000' },
});
