import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function AddPropertyScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [type, setType] = useState<'boys' | 'girls' | 'co-ed'>('co-ed');
  const [amenitiesInput, setAmenitiesInput] = useState('');

  const handleCreateProperty = async () => {
    if (!name || !address || !city || !pincode) {
      handleAlert('Validation Error', 'Please complete all address and descriptor input fields.');
      return;
    }

    setLoading(true);

    try {
      // 1. Get current authenticated user session metadata
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error('No valid operational security token found.');

      // 2. Parse amenities comma-separated string into a clean database text array
      const amenitiesArray = amenitiesInput
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      // 3. Insert row entries directly into public.properties database table
      const { error: insertError } = await supabase
        .from('properties')
        .insert([
          {
            owner_id: session.user.id,
            name,
            address,
            city,
            pincode,
            type,
            total_rooms: 0, // Defaults to zero until rooms are dynamically added next
            amenities: amenitiesArray,
            photos: [],
          },
        ]);

      if (insertError) throw insertError;

      handleAlert('Success', 'Property complex registered successfully.');
      router.replace('/(owner)/dashboard');
    } catch (error: any) {
      handleAlert('Execution Failure', error.message || 'Failed to initialize asset entry.');
    } finally {
      setLoading(false);
    }
  };

  const handleAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') alert(`${title}: ${message}`);
    else Alert.alert(title, message);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Structural Header Action Bar */}
      <View style={{ backgroundColor: '#2563eb', paddingHorizontal: 24, paddingTop: 64, paddingBottom: 28 }}>
        <TouchableOpacity onPress={() => router.replace('/(owner)/dashboard')} style={{ marginBottom: 12 }}>
          <Text style={{ color: '#dbeafe', fontSize: 14, fontWeight: '600' }}>← Back to Dashboard</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#ffffff' }}>Register Property</Text>
        <Text style={{ color: '#dbeafe', fontSize: 13, marginTop: 2 }}>Deploy a new hostel or PG asset container onto the ecosystem</Text>
      </View>

      {/* Onboarding Form Layout */}
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <View style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#e2e8f0' }}>
          
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Hostel / PG Business Name</Text>
          <TextInput
            style={{ backgroundColor: '#f1f5f9', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#0f172a', marginBottom: 16 }}
            placeholder="e.g. Stayease Luxury Living"
            placeholderTextColor="#94a3b8"
            value={name}
            onChangeText={setName}
          />

          <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Street Address</Text>
          <TextInput
            style={{ backgroundColor: '#f1f5f9', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#0f172a', marginBottom: 16 }}
            placeholder="Plot Number, Building Sector, Area Road"
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={2}
            value={address}
            onChangeText={setAddress}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ width: '48%' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 6 }}>City</Text>
              <TextInput
                style={{ backgroundColor: '#f1f5f9', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#0f172a', marginBottom: 16 }}
                placeholder="Bangalore"
                placeholderTextColor="#94a3b8"
                value={city}
                onChangeText={setCity}
              />
            </View>
            <View style={{ width: '48%' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Pincode</Text>
              <TextInput
                style={{ backgroundColor: '#f1f5f9', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#0f172a', marginBottom: 16 }}
                placeholder="560001"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
                value={pincode}
                onChangeText={setPincode}
              />
            </View>
          </View>

          {/* Occupancy Target Split Group */}
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 }}>Target Occupancy Type</Text>
          <View style={{ flexDirection: 'row', marginBottom: 16 }}>
            {(['boys', 'girls', 'co-ed'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setType(t)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  backgroundColor: type === t ? '#2563eb' : '#f1f5f9',
                  borderWidth: 1,
                  borderColor: type === t ? '#2563eb' : '#e2e8f0',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: t === 'boys' ? 8 : 0,
                  borderTopRightRadius: t === 'co-ed' ? 8 : 0,
                  borderBottomRightRadius: t === 'co-ed' ? 8 : 0,
                  borderTopLeftRadius: t === 'boys' ? 8 : 0,
                  borderBottomLeftRadius: t === 'boys' ? 8 : 0,
                }}
              >
                <Text style={{ fontWeight: '600', fontSize: 13, textTransform: 'capitalize', color: type === t ? '#ffffff' : '#475569' }}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Included Amenities (Comma Separated)</Text>
          <TextInput
            style={{ backgroundColor: '#f1f5f9', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#0f172a', marginBottom: 24 }}
            placeholder="WiFi, AC, CCTV, Food, Laundry"
            placeholderTextColor="#94a3b8"
            value={amenitiesInput}
            onChangeText={setAmenitiesInput}
          />

          <TouchableOpacity
            onPress={handleCreateProperty}
            disabled={loading}
            style={{ backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700' }}>Save & Launch Property</Text>
            )}
          </TouchableOpacity>

        </View>
      </View>
    </ScrollView>
  );
}
