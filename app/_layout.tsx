import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // 1. Fetch the user session immediately when the app starts
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Listen continuously for auth state changes (Sign In, Sign Out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Wait until we are sure whether the user is logged in or out
    if (loading) return;

    // Determine which folder stack the user is trying to look at
    const currentSegmentGroup = segments[0];
    const inAuthGroup = currentSegmentGroup === '(auth)';
    const inOwnerGroup = currentSegmentGroup === '(owner)';
    const inTenantGroup = currentSegmentGroup === '(tenant)';

    // RULE 1: If NOT logged in, block them from private dashboards and force them to login
    if (!session) {
      if (inOwnerGroup || inTenantGroup) {
        router.replace('/(auth)/login');
      }
    } 
    // RULE 2: If logged in and sitting on the login screen, route them forward to the dashboard
    else if (session && (inAuthGroup || segments.length === 0)) {
      router.replace('/(owner)/dashboard');
    }
  }, [session, loading, segments]);

  // Show a loading spinner while checking security credentials
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  // Define our isolated screen navigation groups
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(public)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(owner)" />
      <Stack.Screen name="(tenant)" />
    </Stack>
  );
}
