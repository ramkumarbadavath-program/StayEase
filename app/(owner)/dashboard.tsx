import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function OwnerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    propertiesCount: 0,
    roomsCount: 0,
    vacantRoomsCount: 0,
    tenantsCount: 0,
  });
  const [ownerName, setOwnerName] = useState('Owner');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Get current logged-in user session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) return;

      const userId = session.user.id;

      // 2. Fetch Owner profile details to display their name
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('name')
        .eq('id', userId)
        .single();
      
      if (!profileError && profileData) {
        setOwnerName(profileData.name);
      }

      // 3. Fetch count of properties owned by this user
      const { data: properties, error: propsError } = await supabase
        .from('properties')
        .select('id')
        .eq('owner_id', userId);
      
      if (propsError) throw propsError;
      const propIds = properties?.map(p => p.id) || [];

      let roomsCount = 0;
      let vacantCount = 0;
      let tenantsCount = 0;

      if (propIds.length > 0) {
        // 4. Fetch room statistics linked to these properties
        const { data: rooms, error: roomsError } = await supabase
          .from('rooms')
          .select('status')
          .in('property_id', propIds);
        
        if (roomsError) throw roomsError;
        
        if (rooms) {
          roomsCount = rooms.length;
          vacantCount = rooms.filter(r => r.status === 'vacant').length;
        }

        // 5. Fetch total active tenants linked to these properties
        const { data: tenants, error: tenantsError } = await supabase
          .from('tenants')
          .select('id')
          .in('property_id', propIds)
          .eq('status', 'Active');
        
        if (tenantsError) throw tenantsError;
        if (tenants) {
          tenantsCount = tenants.length;
        }
      }

      setStats({
        propertiesCount: propIds.length,
        roomsCount,
        vacantRoomsCount: vacantCount,
        tenantsCount,
      });

    } catch (error: any) {
      const msg = error.message || 'Could not load dashboard statistics.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Header Profile Summary section */}
      <View style={{ backgroundColor: '#0f172a', paddingHorizontal: 24, paddingTop: 64, paddingBottom: 40, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 14, color: '#94a3b8', fontWeight: '500' }}>Welcome back,</Text>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#ffffff', marginTop: 2 }}>{ownerName}</Text>
          </View>
          <TouchableOpacity 
            onPress={handleSignOut}
            style={{ backgroundColor: '#334155', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}
          >
            <Text style={{ color: '#f1f5f9', fontSize: 12, fontWeight: '600' }}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Grid Statistics Layout */}
      <View style={{ paddingHorizontal: 20, marginTop: -20 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          
          {/* Card 1: Total Properties */}
          <View style={{ backgroundColor: '#ffffff', width: '47%', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 2, elevation: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b' }}>Properties</Text>
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#0f172a', marginTop: 6 }}>{stats.propertiesCount}</Text>
          </View>

          {/* Card 2: Total Rooms */}
          <View style={{ backgroundColor: '#ffffff', width: '47%', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 2, elevation: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b' }}>Total Rooms</Text>
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#2563eb', marginTop: 6 }}>{stats.roomsCount}</Text>
          </View>

          {/* Card 3: Vacant Rooms */}
          <View style={{ backgroundColor: '#ffffff', width: '47%', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 2, elevation: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b' }}>Vacant Rooms</Text>
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#10b981', marginTop: 6 }}>{stats.vacantRoomsCount}</Text>
          </View>

          {/* Card 4: Active Residents */}
          <View style={{ backgroundColor: '#ffffff', width: '47%', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 2, elevation: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b' }}>Active Tenants</Text>
            <Text style={{ fontSize: 28, fontWeight: '800', color: '#f59e0b', marginTop: 6 }}>{stats.tenantsCount}</Text>
          </View>

        </View>
      </View>

      {/* Quick Business Actions Center */}
      <View style={{ paddingHorizontal: 20, marginTop: 12, marginBottom: 40 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 16 }}>Quick Operations</Text>

        <View style={{ backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', padding: 8 }}>
          
          <TouchableOpacity 
            style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}
            onPress={() => alert('Property creation form navigation coming next step!')}
          >
            <View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a' }}>🏢 Add New Property</Text>
              <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Register a new hostel or PG complex building</Text>
            </View>
            <Text style={{ color: '#94a3b8', fontSize: 18 }}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}
            onPress={() => alert('Room creation form navigation coming next step!')}
          >
            <View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a' }}>🛏️ Manage Rooms & Rent</Text>
              <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Configure sharing, pricing, and set vacancy details</Text>
            </View>
            <Text style={{ color: '#94a3b8', fontSize: 18 }}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            onPress={() => alert('Invoices panel coming up!')}
          >
            <View>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a' }}>🧾 Collect Rent & Bills</Text>
              <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Track monthly rent status, dues, and payment histories</Text>
            </View>
            <Text style={{ color: '#94a3b8', fontSize: 18 }}>→</Text>
          </TouchableOpacity>

        </View>
      </View>
    </ScrollView>
  );
}
