import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { initializeRazorpayPayment } from '../../lib/razorpay';

export default function TenantDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tenantName, setTenantName] = useState('Resident');
  const [tenantPhone, setTenantPhone] = useState('');
  const [tenantEmail, setTenantEmail] = useState('');
  
  const [stayDetails, setStayDetails] = useState<{
    propertyName: string;
    roomNumber: string;
    sharingType: string;
    rentAmount: number;
  } | null>(null);
  
  const [latestInvoice, setLatestInvoice] = useState<{
    id: string;
    month: string;
    amount: number;
    dueDate: string;
    status: 'paid' | 'pending' | 'overdue';
  } | null>(null);

  useEffect(() => {
    fetchTenantData();
  }, []);

  const fetchTenantData = async () => {
    try {
      setLoading(true);

      // 1. Get current logged-in user session context
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) return;

      const userId = session.user.id;
      setTenantEmail(session.user.email || '');

      // 2. Fetch user baseline profile details
      const { data: userProfile } = await supabase
        .from('users')
        .select('name, phone')
        .eq('id', userId)
        .single();
      
      if (userProfile) {
        setTenantName(userProfile.name);
        setTenantPhone(userProfile.phone);
      }

      // 3. Fetch active stay assignment records linked to this tenant
      const { data: tenantRecord } = await supabase
        .from('tenants')
        .select('property_id, room_id, status')
        .eq('user_id', userId)
        .eq('status', 'Active')
        .maybeSingle();

      if (tenantRecord && tenantRecord.room_id) {
        // 4. Fetch linked Property Name details
        const { data: propertyData } = await supabase
          .from('properties')
          .select('name')
          .eq('id', tenantRecord.property_id)
          .single();

        // 5. Fetch linked Room specifications
        const { data: roomData } = await supabase
          .from('rooms')
          .select('room_number, sharing_type, rent_amount')
          .eq('id', tenantRecord.room_id)
          .single();

        if (propertyData && roomData) {
          setStayDetails({
            propertyName: propertyData.name,
            roomNumber: roomData.room_number,
            sharingType: roomData.sharing_type,
            rentAmount: roomData.rent_amount,
          });
        }

        // 6. Fetch the latest monthly invoice ledger entry
        const { data: invoiceData } = await supabase
          .from('invoices')
          .select('id, month, amount, due_date, status')
          .eq('tenant_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (invoiceData) {
          setLatestInvoice({
            id: invoiceData.id,
            month: invoiceData.month,
            amount: invoiceData.amount,
            dueDate: invoiceData.due_date,
            status: invoiceData.status as any,
          });
        }
      }
    } catch (error: any) {
      const msg = error.message || 'Could not load your stay dashboard data.';
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

  // Launches the official Razorpay processing modal wrapper
  const handlePaymentExecution = (invoiceId: string, amount: number) => {
    initializeRazorpayPayment(
      invoiceId,
      amount,
      {
        name: tenantName,
        email: tenantEmail,
        contact: tenantPhone,
      },
      () => {
        // Success Callback Function
        const msg = 'Payment captured securely! Your digital ledger invoice status has been updated.';
        if (Platform.OS === 'web') alert(msg);
        else Alert.alert('Success', msg);
        
        // Refresh the local UI metrics instantly
        fetchTenantData();
      },
      (errorMessage) => {
        // Error/Cancellation Callback Function
        if (Platform.OS === 'web') alert(`Transaction Interrupted: ${errorMessage}`);
        else Alert.alert('Payment Status', errorMessage);
      }
    );
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
      {/* Header Frame */}
      <View style={{ backgroundColor: '#2563eb', paddingHorizontal: 24, paddingTop: 64, paddingBottom: 40, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 14, color: '#dbeafe', fontWeight: '500' }}>Welcome home,</Text>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#ffffff', marginTop: 2 }}>{tenantName}</Text>
          </View>
          <TouchableOpacity 
            onPress={handleSignOut}
            style={{ backgroundColor: '#1d4ed8', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}
          >
            <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '600' }}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 20 }}>
        
        {/* Accommodation Specs */}
        {stayDetails ? (
          <View style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#2563eb', textTransform: 'uppercase', letterSpacing: 0.5 }}>Current Accommodation</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a', marginTop: 6 }}>{stayDetails.propertyName}</Text>
            
            <View style={{ flexDirection: 'row', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '500' }}>Room</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a', marginTop: 2 }}>{stayDetails.roomNumber}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '500' }}>Sharing Configuration</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a', marginTop: 2, textTransform: 'capitalize' }}>{stayDetails.sharingType}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ color: '#64748b', textAlign: 'center', fontWeight: '500', fontSize: 15 }}>
              You are not assigned to an active room yet. Contact your property owner to finalize check-in.
            </Text>
          </View>
        )}

        {/* Rent & Razorpay Integration UI */}
        {stayDetails && (
          <View style={{ backgroundColor: '#ffffff', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 14 }}>Rent & Invoices</Text>
            
            {latestInvoice ? (
              <View style={{ backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, borderLeftWidth: 4, borderLeftColor: latestInvoice.status === 'paid' ? '#10b981' : '#f59e0b' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a' }}>{latestInvoice.month} Rental Bill</Text>
                    <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Due date: {latestInvoice.dueDate}</Text>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>₹{latestInvoice.amount}</Text>
                </View>

                {latestInvoice.status !== 'paid' ? (
                  <TouchableOpacity 
                    onPress={() => handlePaymentExecution(latestInvoice.id, latestInvoice.amount)}
                    style={{ backgroundColor: '#10b981', marginTop: 16, paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '700' }}>Pay Securely Now</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ backgroundColor: '#e6f4ea', marginTop: 16, paddingVertical: 10, borderRadius: 8, alignItems: 'center' }}>
                    <Text style={{ color: '#137333', fontSize: 13, fontWeight: '700' }}>✓ Invoice Settled via Razorpay</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={{ paddingVertical: 8 }}>
                <Text style={{ color: '#64748b', fontSize: 14, fontWeight: '500' }}>No pending invoices tracking for this processing cycle.</Text>
              </View>
            )}
          </View>
        )}

      </View>
    </ScrollView>
  );
}
