import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'owner' | 'tenant'>('tenant');

  const handleAuthentication = async () => {
    if (!email || !password) {
      handleAlert('Error', 'Please fill in all required fields.');
      return;
    }

    if (isSignUp && (!name || !phone)) {
      handleAlert('Error', 'Please provide your name and phone number for registration.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // 1. Sign up the user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) throw authError;

        if (authData.user) {
          // 2. Insert custom profile details into our public.users table
          const { error: profileError } = await supabase
            .from('users')
            .insert([
              {
                id: authData.user.id,
                name,
                email,
                phone,
                role,
              },
            ]);

          if (profileError) throw profileError;
          handleAlert('Success', 'Account created successfully! Welcome to StayEase.');
        }
      } else {
        // Log in existing user
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      }
    } catch (error: any) {
      handleAlert('Authentication Error', error.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to handle cross-platform notifications (Web vs. Mobile)
  const handleAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ justifyContent: 'center', paddingVertical: 60 }}>
      <View style={{ paddingHorizontal: 24 }}>
        
        {/* Header Text */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Text style={{ fontSize: 32, fontWeight: '800', color: '#2563eb' }}>StayEase</Text>
          <Text style={{ fontSize: 16, color: '#64748b', marginTop: 8, textAlign: 'center' }}>
            {isSignUp ? 'Create your account to join a property' : 'Manage your stay or property seamlessly'}
          </Text>
        </View>

        {/* Auth Form Container Card */}
        <View style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 }}>
          
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 20, textAlign: 'center' }}>
            {isSignUp ? 'Sign Up New Account' : 'Welcome Back'}
          </Text>

          {/* Conditional Sign-Up Fields */}
          {isSignUp && (
            <View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Full Name</Text>
              <TextInput
                style={{ backgroundColor: '#f1f5f9', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#0f172a', marginBottom: 16 }}
                placeholder="John Doe"
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={setName}
              />

              <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Phone Number</Text>
              <TextInput
                style={{ backgroundColor: '#f1f5f9', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#0f172a', marginBottom: 16 }}
                placeholder="e.g. +91 9876543210"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />

              {/* Role Selection Tabs */}
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 }}>I am a:</Text>
              <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                <TouchableOpacity
                  onPress={() => setRole('tenant')}
                  style={{ flex: 1, paddingVertical: 12, backgroundColor: role === 'tenant' ? '#2563eb' : '#f1f5f9', borderTopLeftRadius: 10, borderBottomLeftRadius: 10, alignItems: 'center' }}
                >
                  <Text style={{ fontWeight: '600', color: role === 'tenant' ? '#ffffff' : '#475569' }}>Tenant / Resident</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setRole('owner')}
                  style={{ flex: 1, paddingVertical: 12, backgroundColor: role === 'owner' ? '#2563eb' : '#f1f5f9', borderTopRightRadius: 10, borderBottomRightRadius: 10, alignItems: 'center' }}
                >
                  <Text style={{ fontWeight: '600', color: role === 'owner' ? '#ffffff' : '#475569' }}>Property Owner</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Standard Fields (Always Visible) */}
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Email Address</Text>
          <TextInput
            style={{ backgroundColor: '#f1f5f9', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#0f172a', marginBottom: 16 }}
            placeholder="name@example.com"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Password</Text>
          <TextInput
            style={{ backgroundColor: '#f1f5f9', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#0f172a', marginBottom: 24 }}
            placeholder="••••••••"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
          />

          {/* Submit Action Button */}
          <TouchableOpacity
            onPress={handleAuthentication}
            disabled={loading}
            style={{ backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700' }}>
                {isSignUp ? 'Create Account' : 'Sign In Securely'}
              </Text>
            )}
          </TouchableOpacity>

          {/* Switch Mode Button */}
          <TouchableOpacity
            onPress={() => setIsSignUp(!isSignUp)}
            style={{ marginTop: 16, alignItems: 'center' }}
          >
            <Text style={{ color: '#2563eb', fontSize: 14, fontWeight: '600' }}>
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>

        </View>

        {/* Return Button to Public Directory */}
        <TouchableOpacity
          onPress={() => router.replace('/(public)')}
          style={{ marginTop: 24, alignItems: 'center' }}
        >
          <Text style={{ color: '#64748b', fontSize: 14, fontWeight: '500' }}>← Back to browse stays</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}
