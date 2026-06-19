import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Spacing } from '@/constants/theme';

type PickedFile = { name: string; size: number };

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadScreen() {
  const router = useRouter();
  const [file, setFile] = useState<PickedFile | null>(null);
  const [url, setUrl] = useState('');

  const canUpload = file !== null || url.trim().length > 0;

  async function pickFromLibrary() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission required',
        'ClipCash needs access to your media library to pick videos. Please enable it in Settings.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setFile({
        name: asset.fileName ?? asset.uri.split('/').pop() ?? 'video',
        size: asset.fileSize ?? 0,
      });
      setUrl('');
    }
  }

  function handleUpload() {
    router.push('/processing');
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.heading}>
          Upload Video
        </ThemedText>

        {/* Pick from library */}
        <Pressable style={styles.pickButton} onPress={pickFromLibrary}>
          <ThemedText type="subtitle">📁  Pick from Library</ThemedText>
        </Pressable>

        {/* File info */}
        {file && (
          <ThemedView type="backgroundElement" style={styles.fileInfo}>
            <ThemedText type="subtitle" numberOfLines={1}>
              {file.name}
            </ThemedText>
            {file.size > 0 && (
              <ThemedText type="small" themeColor="textSecondary">
                {formatBytes(file.size)}
              </ThemedText>
            )}
          </ThemedView>
        )}

        {/* Divider */}
        <ThemedText type="small" themeColor="textSecondary" style={styles.orText}>
          — or paste a link —
        </ThemedText>

        {/* URL input */}
        <TextInputWithTheme
          value={url}
          onChangeText={(text) => {
            setUrl(text);
            if (text.trim()) setFile(null);
          }}
          placeholder="YouTube or TikTok URL"
        />

        {/* Upload button */}
        <Pressable
          style={[styles.uploadButton, !canUpload && styles.uploadButtonDisabled]}
          onPress={handleUpload}
          disabled={!canUpload}>
          <ThemedText type="subtitle" style={styles.uploadButtonText}>
            ⚡  Quick Upload
          </ThemedText>
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

function TextInputWithTheme(props: React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.inputWrapper}>
      <TextInput
        {...props}
        style={styles.input}
        placeholderTextColor="#888"
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />
    </View>
  );
}

const TEAL = '#0ABFBF';

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.three,
    gap: Spacing.three,
  },
  heading: { marginBottom: Spacing.two },
  pickButton: {
    borderWidth: 1.5,
    borderColor: TEAL,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  fileInfo: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  orText: { textAlign: 'center' },
  inputWrapper: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Platform.OS === 'ios' ? Spacing.three : 0,
  },
  input: {
    color: '#fff',
    fontSize: 15,
    minHeight: 44,
  },
  uploadButton: {
    backgroundColor: TEAL,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: 'auto',
  },
  uploadButtonDisabled: { opacity: 0.35 },
  uploadButtonText: { color: '#fff' },
});
