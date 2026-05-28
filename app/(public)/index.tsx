import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';

// Sample Mock Data to test UI immediately without needing mock DB rows yet
const MOCK_PROPERTIES = [
  {
    id: '1',
    name: 'StayEase Premium Boys PG',
    type: 'boys',
    city: 'Delhi',
    address: 'Near Delhi University, North Campus',
    price: '₹8,500/mo',
    amenities: ['WiFi', 'AC', 'Food', 'Geyser'],
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=500&q=80'
  },
  {
    id: '2',
    name: 'Serene Luxury Girls Hostel',
    type: 'girls',
    city: 'Bangalore',
    address: 'Koramangala 4th Block, near Sony Signal',
    price: '₹12,000/mo',
    amenities: ['WiFi', 'AC', 'Gym', 'Security'],
    image: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=500&q=80'
  }
];

export default function PublicDiscoveryScreen() {
  const router = useRouter();
  const [searchCity, setSearchCity] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'boys' | 'girls'>('all');

  // Filter listings based on user search input and gender buttons
  const filteredProperties = MOCK_PROPERTIES.filter(property => {
    const matchesCity = property.city.toLowerCase().includes(searchCity.toLowerCase());
    const matchesType = selectedType === 'all' || property.type === selectedType;
    return matchesCity && matchesType;
  });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Hero Header Banner Component */}
      <View style={{ backgroundColor: '#2563eb', paddingHorizontal: 24, paddingTop: 64, paddingBottom: 48, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <Text style={{ fontSize: 30, fontWeight: '800', color: '#ffffff', letterSpacing: -0.5 }}>StayEase</Text>
        <Text style={{ color: '#dbeafe', fontSize: 14, marginTop: 4, fontWeight: '500' }}>Find your perfect student & professional stay instantly</Text>
        
        {/* Search Bar Input */}
        <View style={{ marginTop: 24, backgroundColor: '#ffffff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            style={{ flex: 1, color: '#1e293b', fontSize: 16, height: 24 }}
            placeholder="Search by city (e.g. Delhi, Bangalore)..."
            placeholderTextColor="#94a3b8"
            value={searchCity}
            onChangeText={setSearchCity}
          />
        </View>
      </View>

      {/* Main Container Content */}
      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 12 }}>Filter by Sharing Type</Text>
        
        {/* Filter Quick Buttons Container */}
        <View style={{ flexDirection: 'row', marginBottom: 24 }}>
          {(['all', 'boys', 'girls'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setSelectedType(type)}
              style={{
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 9999,
                borderWidth: 1,
                marginRight: 8,
                backgroundColor: selectedType === type ? '#2563eb' : '#ffffff',
                borderColor: selectedType === type ? '#2563eb' : '#e2e8f0'
              }}
            >
              <Text style={{
                fontSize: 14,
                fontWeight: '600',
                textTransform: 'capitalize',
                color: selectedType === type ? '#ffffff' : '#475569'
              }}>
                {type === 'all' ? 'All Stays' : `${type}' PG`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Listings Headline Section */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#0f172a' }}>Available Hostels & PGs</Text>
          <Text style={{ fontSize: 14, color: '#2563eb', fontWeight: '600' }}>{filteredProperties.length} found</Text>
        </View>

        {/* Dynamic Property Listing Loop Mapping */}
        {filteredProperties.length === 0 ? (
          <View style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 32, borderWidth: 1, borderColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
            <Text style={{ color: '#94a3b8', fontWeight: '500', textAlign: 'center' }}>No properties found matching your search options.</Text>
          </View>
        ) : (
          filteredProperties.map((property) => (
            <View key={property.id} style={{ backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#f1f5f9', overflow: 'hidden', marginBottom: 20 }}>
              <Image source={{ uri: property.image }} style={{ width: '100%', height: 192, backgroundColor: '#e2e8f0' }} />
              
              <View style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 6,
                    backgroundColor: property.type === 'boys' ? '#eff6ff' : '#fdf2f8'
                  }}>
                    <Text style={{
                      fontSize: 12,
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      color: property.type === 'boys' ? '#2563eb' : '#db2777'
                    }}>
                      {property.type} only
                    </Text>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '900', color: '#2563eb' }}>{property.price}</Text>
                </View>

                <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a', marginTop: 8 }} numberOfLines={1}>{property.name}</Text>
                <Text style={{ color: '#64748b', fontSize: 12, marginTop: 4, fontWeight: '500' }} numberOfLines={1}>📍 {property.address}</Text>

                {/* Amenities Badges Row */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 14 }}>
                  {property.amenities.map((amenity, i) => (
                    <View key={i} style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginRight: 6, marginBottom: 6 }}>
                      <Text style={{ color: '#475569', fontSize: 12, fontWeight: '500' }}>
                        {amenity}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* CTA Action Button */}
                <TouchableOpacity 
                  onPress={() => router.push('/(auth)/login')}
                  style={{ backgroundColor: '#0f172a', marginTop: 20, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700', letterSpacing: 0.5 }}>Login to View Details & Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
