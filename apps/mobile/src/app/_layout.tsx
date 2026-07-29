import { queryClient } from '@repo/core';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AuthProvider, useAuth } from '@/lib/auth-context';
import '@/lib/api';
import '@/global.css';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="auto" />
        <RootNavigator />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function RootNavigator() {
  const { status } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Auth state is the single source of truth for navigation: redirect anon
  // users to (auth), and authed users away from it.
  useEffect(() => {
    if (status === 'loading') return;
    // String() keeps this resilient to `typedRoutes` generated-type staleness.
    const inAuthGroup = String(segments[0]) === '(auth)';
    if (status === 'anon' && !inAuthGroup) {
      router.replace('/login' as Href);
    } else if (status === 'authed' && inAuthGroup) {
      router.replace('/' as Href);
    }
  }, [status, segments, router]);

  if (status === 'loading') {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color="#fff" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#0b0b0f',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
