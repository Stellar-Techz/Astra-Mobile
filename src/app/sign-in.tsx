import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useGoogleAuth } from '@/hooks/use-google-auth';
import { useMagicLink } from '@/hooks/use-magic-link';
import { brandTeal } from '@/constants/theme';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const { promptAsync, request } = useGoogleAuth();
  const { sendMagicLink, status, error } = useMagicLink();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.inner}>
        <Text style={styles.title}>ClipCash</Text>
        <Text style={styles.subtitle}>Sign in to get started</Text>

        {/* Google OAuth */}
        <Pressable
          style={[styles.button, styles.googleButton]}
          onPress={() => promptAsync()}
          disabled={!request}
          accessibilityRole="button"
          accessibilityLabel="Sign in with Google">
          <Text style={styles.buttonText}>Continue with Google</Text>
        </Pressable>

        <Text style={styles.divider}>or</Text>

        {/* Magic link */}
        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor="#888"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          value={email}
          onChangeText={setEmail}
          accessibilityLabel="Email address"
        />

        <Pressable
          style={[styles.button, styles.magicButton]}
          onPress={() => sendMagicLink(email)}
          disabled={status === 'sending' || !email.includes('@')}
          accessibilityRole="button"
          accessibilityLabel="Send magic link">
          {status === 'sending' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {status === 'sent' ? 'Check your email ✓' : 'Send magic link'}
            </Text>
          )}
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 12,
  },
  title: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 16, color: '#888', marginBottom: 12 },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  googleButton: { backgroundColor: '#fff' },
  magicButton: { backgroundColor: brandTeal },
  buttonText: { fontWeight: '600', fontSize: 16, color: '#000' },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 16,
    backgroundColor: '#111',
  },
  divider: { color: '#555', fontSize: 14 },
  error: { color: '#f66', fontSize: 14 },
});
