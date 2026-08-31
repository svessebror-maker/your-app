import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { SessionUser } from './database';

type Props = {
  user: SessionUser;
  onLogout: () => void;
};

export function HomeScreen({ user, onLogout }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <View style={styles.mark}>
          <Ionicons name="checkmark" size={32} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>Signed in</Text>
        <Text style={styles.subtitle}>{user.username}</Text>
        <Text style={styles.meta}>Authenticated against the local SQLite users table.</Text>
        <Pressable
          onPress={onLogout}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Sign Out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  mark: {
    alignSelf: 'center',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#34C759',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    textAlign: 'center',
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 22,
    fontWeight: '600',
    color: '#000000',
  },
  meta: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 15,
    color: '#8E8E93',
  },
  button: {
    marginTop: 32,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FF3B30',
    fontSize: 17,
    fontWeight: '600',
  },
});
