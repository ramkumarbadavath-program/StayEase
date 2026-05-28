import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function AddRoomScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetchingProperties, setFetchingProperties] = useState(true);
  
  // Data State
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [floor, setFloor] = useState('');
  const [roomType, setRoomType] = useState<'AC' | 'non-AC'>('non-AC');
  const [sharingType, setSharingType] = useState<'single' | 'double' | 'triple' | 'quadruple'>('single');
  const [rentAmount, setRentAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [amenitiesInput, setAmenitiesInput] = useState('');

  useEffect(() => {
    loadOwnerProperties();
  }, []);

  // Fetch properties belonging to the logged-in owner to populate a dropdown selector
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
        setSelectedPropertyId(data[0].id); // Default select the first property found
      }
    } catch (error: any) {
      handleAlert('Error', error.message || 'Failed to fetch your properties.');
    } finally {
      setFetchingProperties(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!selectedPropertyId || !roomNumber || !floor || !rentAmount || !depositAmount) {
      handleAlert('Validation Error', 'Please complete all required fields.');
      return;
    }

    setLoading(true);

    try {
      // Parse optional amenities input
      const amenitiesArray = amenitiesInput
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      // 1. Insert the new room into the rooms table
      const { error: insertError } = await supabase
        .from('rooms')
        .insert([
          {
            property_id: selectedPropertyId,
            room_number: roomNumber,
            floor: parseInt(floor, 10),
            type: roomType,
            sharing_type: sharingType,
            rent_amount: parseFloat(rentAmount),
            deposit_amount: parseFloat(depositAmount),
            status: 'vacant',
            amenities: amenitiesArray,
            photos: []
          }
        ]);

      if (insertError) throw insertError;

      // 2. Increment total_rooms count on the matching property record using a RPC or direct query
      // For cross-platform stability, we perform a quick relational update
      const targetProperty = properties.find(p => p.id === selectedPropertyId);
      if (targetProperty) {
        const { data: propertyData } = await supabase
          .from('properties')
          .select('total_rooms')
          .eq('id', selectedPropertyId)
          .single();

        const currentTotal = propertyData?.total_rooms || 0;

        await supabase
          .from('properties')
          .update({ total_rooms: currentTotal + 1 })
          .eq('id', selectedPropertyId);
      }

      handleAlert('Success', `Room ${roomNumber} added successfully.`);
      router.replace('/(owner)/dashboard');
    } catch (error: any) {
      handleAlert('Execution Failure', error.message || 'Failed to create room.');
    } finally {
      setLoading(false);
    }
  };

  const handleAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') alert(`${title}: ${message}`);
    else Alert.alert(title, message);
  };

  if (fetchingProperties) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header Layout Component */}
      <View style={{ backgroundColor: '#2563eb', paddingHorizontal: 24, paddingTop: 64, paddingBottom: 28 }}>
        <TouchableOpacity onPress={() => router.replace('/(owner)/dashboard')} style={{ marginBottom: 12 }}>
          <Text style={{ color: '#dbeafe', fontSize: 14, fontWeight: '600' }}>← Back to Dashboard</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#ffffff' }}>Add New Room</Text>
        <Text style={{ color: '#dbeafe', fontSize: 13, marginTop: 2 }}>Configure sharing, physical attributes, and pricing points</Text>
      </View>

      {/* Main Room Form Layout */}
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        {properties.length === 0 ? (
          <View style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' }}>
            <Text style={{ color: '#64748b', textAlign: 'center', marginBottom: 16, fontWeight: '500' }}>
              You must register at least one property building before assigning physical room inventories.
            </Text>
            <TouchableOpacity 
              onPress={() => router.push('/(owner)/add-property')}
              style={{ backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 }}
            >
              <Text style={{ color: '#ffffff', fontWeight: '600' }}>Register a Property First</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#e2e8f0' }}>
            
            {/* Property Association Selector */}
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Select Property Linkage</Text>
            <View style={{ backgroundColor: '#f1f5f9', borderRadius: 10, marginBottom: 16, overflow: 'hidden' }}>
              {Platform.OS === 'web' ? (
                <select
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  style={{ width: '100%', padding: 12, background: 'transparent', border: 'none', fontSize: 16, color: '#0f172a', fontFamily: 'inherit' }}
                >
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              ) : (
                // Simple Native Fallback View for UI Form Flow consistency
                <View style={{ padding: 12 }}>
                  {properties.map(p => (
                    <TouchableOpacity 
                      key={p.id} 
                      onPress={() => setSelectedPropertyId(p.id)} 
                      style={{ paddingVertical: 6, borderBottomWidth: selectedPropertyId === p.id ? 0 : 1, borderBottomColor: '#e2e8f0' }}
                    >
                      <Text style={{ fontSize: 15, fontWeight: selectedPropertyId === p.id ? '700' : '400', color: selectedPropertyId === p.id ? '#2563eb' : '#475569' }}>
                        {selectedPropertyId === p.id ? `✓ ${p.name}` : p.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Room Identifier Fields */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ width: '48%' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Room Number</Text>
                <TextInput
                  style={{ backgroundColor: '#f1f5f9', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#0f172a', marginBottom: 16 }}
                  placeholder="e.g. 101-A"
                  placeholderTextColor="#94a3b8"
                  value={roomNumber}
                  onChangeText={setRoomNumber}
                />
              </View>
              <View style={{ width: '48%' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Floor</Text>
                <TextInput
                  style={{ backgroundColor: '#f1f5f9', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#0f172a', marginBottom: 16 }}
                  placeholder="1"
                  placeholderTextColor="#94a3b8"
                  keyboardType="number-pad"
                  value={floor}
                  onChangeText={setFloor}
                />
              </View>
            </View>

            {/* Room AC Type Group Selector */}
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 }}>Climate Control Configuration</Text>
            <View style={{ flexDirection: 'row', marginBottom: 16 }}>
              {(['AC', 'non-AC'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setRoomType(t)}
                  style={{ flex: 1, paddingVertical: 12, backgroundColor: roomType === t ? '#2563eb' : '#f1f5f9', alignItems: 'center', borderRadius: t === 'AC' ? 8 : 0, borderTopRightRadius: t === 'non-AC' ? 8 : 0, borderBottomRightRadius: t === 'non-AC' ? 8 : 0, borderTopLeftRadius: t === 'AC' ? 8 : 0, borderBottomLeftRadius: t === 'AC' ? 8 : 0 }}
                >
                  <Text style={{ fontWeight: '600', color: roomType === t ? '#ffffff' : '#475569' }}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sharing Type Configurations */}
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 8 }}>Sharing Structure</Text>
            <View style={{ flexDirection: 'row', marginBottom: 16, flexWrap: 'wrap', gap: 4 }}>
              {(['single', 'double', 'triple', 'quadruple'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setSharingType(s)}
                  style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: sharingType === s ? '#2563eb' : '#f1f5f9', borderRadius: 6 }}
                >
                  <Text style={{ fontWeight: '600', fontSize: 12, textTransform: 'capitalize', color: sharingType === s ? '#ffffff' : '#475569' }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Financial Parameters Fields */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ width: '48%' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Monthly Rent (₹)</Text>
                <TextInput
                  style={{ backgroundColor: '#f1f5f9', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#0f172a', marginBottom: 16 }}
                  placeholder="e.g. 7500"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={rentAmount}
                  onChangeText={setRentAmount}
                />
              </View>
              <View style={{ width: '48%' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Security Deposit (₹)</Text>
                <TextInput
                  style={{ backgroundColor: '#f1f5f9', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#0f172a', marginBottom: 16 }}
                  placeholder="e.g. 15000"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={depositAmount}
                  onChangeText={setDepositAmount}
                />
              </View>
            </View>

            <Text style={{ fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 6 }}>Room Specific Amenities (Optional)</Text>
            <TextInput
              style={{ backgroundColor: '#f1f5f9', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#0f172a', marginBottom: 24 }}
              placeholder="e.g. Attached Balcony, Personal Wardrobe"
              placeholderTextColor="#94a3b8"
              value={amenitiesInput}
              onChangeText={setAmenitiesInput}
            />

            <TouchableOpacity
              onPress={handleCreateRoom}
              disabled={loading}
              style={{ backgroundColor: '#2563eb', paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyIntent: 'center' }}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700' }}>Save & Register Inventory</Text>
              )}
            </TouchableOpacity>

          </View>
        )}
      </View>
    </ScrollView>
  );
}
