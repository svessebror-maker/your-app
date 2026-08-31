import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { getSession, logout, type SessionUser } from './src/database';
import { HomeScreen } from './src/HomeScreen';
import { LoginScreen } from './src/LoginScreen';

export default function App() {
  const [ready, setReady] = useState(false);
  const [bootError, setBootError] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    getSession()
      .then((session) => {
        if (!cancelled) {
          setUser(session);
          setReady(true);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setBootError(err instanceof Error ? err.message : 'Could not open the database.');
          setReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color="#007AFF" />
        <StatusBar style="dark" />
      </View>
    );
  }

  if (bootError) {
    return (
      <View style={styles.boot}>
        <Text style={styles.bootError}>{bootError}</Text>
        <StatusBar style="dark" />
      </View>
    );
  }

  return (
    <>
      {user ? (
        <HomeScreen
          user={user}
          onLogout={() => {
            logout().finally(() => setUser(null));
          }}
        />
      ) : (
        <LoginScreen onLoggedIn={setUser} />
      )}
      <StatusBar style="dark" />
    </>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  bootError: {
    textAlign: 'center',
    color: '#FF3B30',
    fontSize: 16,
  },
});
