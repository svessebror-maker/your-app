import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { login, SEED_ACCOUNTS, type SessionUser } from './database';

type Props = {
  onLoggedIn: (user: SessionUser) => void;
};

export function LoginScreen({ onLoggedIn }: Props) {
  const passwordRef = useRef<TextInput>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canSubmit = username.trim().length > 0 && password.length > 0 && !busy;

  async function onSubmit() {
    if (!canSubmit) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      onLoggedIn(await login(username, password));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.mark}>
            <Ionicons name="lock-closed" size={28} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>Sign in</Text>
          <Text style={styles.subtitle}>Database account only</Text>

          <View style={styles.card}>
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              onChangeText={setUsername}
              onSubmitEditing={() => passwordRef.current?.focus()}
              placeholder="Username"
              placeholderTextColor="#8E8E93"
              returnKeyType="next"
              style={styles.input}
              textContentType="username"
              value={username}
            />
            <View style={styles.rule} />
            <View style={styles.passwordRow}>
              <TextInput
                ref={passwordRef}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                onChangeText={setPassword}
                onSubmitEditing={onSubmit}
                placeholder="Password"
                placeholderTextColor="#8E8E93"
                returnKeyType="go"
                secureTextEntry={!showPassword}
                style={[styles.input, styles.passwordInput]}
                textContentType="password"
                value={password}
              />
              <Pressable
                hitSlop={8}
                onPress={() => setShowPassword((value) => !value)}
                style={styles.toggle}
              >
                <Text style={styles.toggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </Pressable>
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            disabled={!canSubmit}
            onPress={onSubmit}
            style={({ pressed }) => [
              styles.button,
              !canSubmit && styles.buttonDisabled,
              pressed && canSubmit && styles.buttonPressed,
            ]}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </Pressable>

          <View style={styles.hintCard}>
            <Text style={styles.hintTitle}>Seeded accounts</Text>
            {SEED_ACCOUNTS.map((account) => (
              <Text key={account.username} style={styles.hintRow}>
                {account.username} / {account.password}
                {account.permissions === 'full' ? ' (full access)' : ''}
              </Text>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  flex: {
    flex: 1,
  },
  body: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  mark: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    textAlign: 'center',
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.3,
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 28,
    fontSize: 17,
    color: '#8E8E93',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
  },
  input: {
    fontSize: 17,
    color: '#000000',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#C6C6C8',
    marginLeft: 16,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    paddingRight: 8,
  },
  toggle: {
    paddingHorizontal: 16,
  },
  toggleText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  error: {
    marginTop: 12,
    textAlign: 'center',
    color: '#FF3B30',
    fontSize: 15,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    borderRadius: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  hintCard: {
    marginTop: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  hintTitle: {
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  hintRow: {
    textAlign: 'center',
    color: '#636366',
    fontSize: 13,
    lineHeight: 20,
  },
});
