import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function AllocateTenantScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  // Lists for dropdown selectors
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [rooms, setRooms] = useState<{ id: string; room_number: string; rent_amount: number }[]>([]);

  // Form State
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [tenantPhone, setTenantPhone] = useState('');
  const [moveInDate, setMoveInDate] = useState('');

  useEffect(() => {
    loadOwnerProperties();
  }, []);

  useEffect(() => {
    if (selectedPropertyId) {
      loadVacantRooms(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  // Fetch properties belonging to the logged-in owner
  const loadOwnerProperties = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('properties')
        .select('id, name')
        .eq('owner_id', session.user.id);

      if (error) throw error;

      if (data && data.length > 0) {
        setProperties(data);
        setSelectedPropertyId(data[0].id);
      }
    } catch (error: any) {
      handleAlert('Error', error.message || 'Failed to fetch properties.');
    } finally {
      setFetchingData(false);
    }
  };

  // Fetch only VACANT rooms for the selected property
  const loadVacantRooms = async (propertyId: string) => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('id, room_number, rent_amount')
        .eq('property_id', propertyId)
        .eq('status', 'vacant');

      if (error) throw error;

      setRooms(data || []);
      if (data && data.length > 0) {
        setSelectedRoomId(data[0].id);
      } else {
        setSelectedRoomId('');
      }
    } catch (error: any) {
      handleAlert('Error', error.message || 'Failed to fetch vacant rooms.');
    }
  };

  const handleAllocation = async () => {
    if (!selectedPropertyId || !selectedRoomId || !tenantPhone || !moveInDate) {
      handleAlert('Validation Error', 'Please complete all required field options.');
      return;
    }

    setLoading(true);

    try {
      // 1. Find the target user inside public.users by checking their phone number
      const { data: targetUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('phone', tenantPhone.trim())
        .eq('role', 'tenant')
        .maybeSingle();

      if (userError) throw userError;
      if (!targetUser) {
        throw new Error('No registered tenant profile found with this phone number. Have them sign up first!');
      }

      // 2. Insert the allocation contract link row inside public.tenants
      const { error: tenantInsertError } = await supabase
        .from('tenants')
        .insert([
          {
            user_id: targetUser.id,
            property_id: selectedPropertyId,
            room_id: selectedRoomId,
            move_in_date: moveInDate,
            status: 'Active'
          }
        ]);

      if (tenantInsertError) throw tenantInsertError;

      // 3. Update the room status to 'occupied' inside public.rooms
      const { error: roomUpdateError } = await supabase
        .from('rooms')
        .update({ status: 'occupied' })
        .eq('id', selectedRoomId);

      if (roomUpdateError) throw roomUpdateError;

      // 4. Generate the initial monthly invoice automatically
      const selectedRoom = rooms.find(r => r.id === selectedRoomId);
      const currentMonth = new Date().toLocaleString('default', { month: 'long' });
      const currentYear = new Date().getFullYear();
      
      // Calculate a due date 5 days from today
      const futureDueDate = new Date();
      futureDueDate.setDate(futureDueDate.getDate() + 5);

      const { error: invoiceError } = await supabase
        .from('invoices')
        .insert([
          {
            tenant_id: targetUser.id,
            property_id: selectedPropertyId,
            month: currentMonth,
            year: currentYear,
            amount: selectedRoom ? selectedRoom.rent_amount : 0,
            due_date: futureDueDate.toISOString().split('T')[0],
            status: 'pending'
          }
        ]);

      if (invoiceError) throw invoiceError;

      handleAlert('Success', 'Tenant allocated, room marked occupied, and rent bill generated successfully.');
      router.replace('/(owner)/dashboard');
    } catch (error: any) {
      handleAlert('Allocation Failure', error.message || 'Processing system error.');
    } finally {
      setLoading(false);
    }
  };

  const handleAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') alert(`${title}: ${message}`);
    else Alert.alert(title, message);
  };

  if (fetchingData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* View Header Action Layout */}
      <View style={{ backgroundColor: '#2563eb', paddingHorizontal: 24, paddingTop: 64, paddingBottom: 28 }}>
        <TouchableOpacity onPress={() => router.replace('/(owner)/dashboard')} style={{ marginBottom: 12 }}>
          <Text style={{ color: '#dbeafe', fontSize: 14, fontWeight: '600' }}>← Back to Dashboard</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#ffffff' }}>Check-In Tenant</Text>
        <Text style={{ color: '#dbeafe', fontSize: 13, marginTop: 2 }}>Assign a registered resident profile directly to a physical room inventory</Text>
      </View>

      {/* Input Allocation Card Form */}
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <View style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#e2e8f0' }}>
          
          {/* Property Selector */}
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Select Property</Text>
          <View style={{ backgroundColor: '#f1f5f9', borderRadius: 10, marginBottom: 16, paddingHorizontal: 12, paddingVertical: Platform.OS === 'web' ? 0 : 8 }}>
            {Platform.OS === 'web' ? (
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                style={{ width: '100%', padding: 12, background: 'transparent', border: 'none', fontSize: 16, color: '#0f172a' }}
              >
                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            ) : (
              properties.map(p => (
                <TouchableOpacity key={p.id} onPress={() => setSelectedPropertyId(p.id)} style={{ paddingVertical: 4 }}>
                  <Text style={{ fontWeight: selectedPropertyId === p.id ? '700' : '400', color: selectedPropertyId === p.id ? '#2563eb' : '#475569' }}>
                    {selectedPropertyId === p.id ? `✓ ${p.name}` : p.name}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Vacant Room Selector */}
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Select Vacant Room</Text>
          <View style={{ backgroundColor: '#f1f5f9', borderRadius: 10, marginBottom: 16, paddingHorizontal: 12, paddingVertical: Platform.OS === 'web' ? 0 : 8 }}>
            {rooms.length === 0 ? (
              <Text style={{ padding: 12, color: '#94a3b8', fontSize: 15 }}>No vacant rooms found in this property portfolio.</Text>
            ) : Platform.OS === 'web' ? (
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                style={{ width: '100%', padding: 12, background: 'transparent', border: 'none', fontSize: 16, color: '#0f172a' }}
              >
                {rooms.map(r => <option key={r.id} value={r.id}>Room {r.room_number} (₹{r.rent_amount}/mo)</option>)}
              </select>
            ) : (
              rooms.map(r => (
                <TouchableOpacity key={r.id} onPress={() => setSelectedRoomId(r.id)} style={{ paddingVertical: 4 }}>
                  <Text style={{ fontWeight: selectedRoomId === r.id ? '700' : '400', color: selectedRoomId === r.id ? '#2563eb' : '#475569' }}>
                    {selectedRoomId === r.id ? `✓ Room ${r.room_number}` : `Room ${r.room_number}`}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Tenant Search Input */}
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Tenant Phone Number</Text>
          <TextInput
            style={{ backgroundColor: '#f1f5f9', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#0f172a', marginBottom: 16 }}
            placeholder="e.g. +91 9876543210"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
            value={tenantPhone}
            onChangeText={setTenantPhone}
          />

          {/* Move In Date */}
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Move-In Date</Text>
          <TextInput
            style={{ backgroundColor: '#f1f5f9', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#0f172a', marginBottom: 24 }}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#94a3b8"
            value={moveInDate}
            onChangeText={setMoveInDate}
          />

          {/* Allocation Action CTA */}
          <TouchableOpacity
            onPress={handleAllocation}
            disabled={loading || rooms.length === 0}
            style={{ backgroundColor: rooms.length === 0 ? '#cbd5e1' : '#2563eb', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700' }}>Confirm Check-In</Text>
            )}
          </TouchableOpacity>

        </View>
      </View>
    </ScrollView>
  );
}
