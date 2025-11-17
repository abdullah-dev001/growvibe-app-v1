import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import ProfileLayout from '../../components/ProfileLayout';
import ScreenWrapper from '../../components/ScreenWrapper';
import { hp } from '../../helpers/common';
import { supabase } from '../../supabaseClient';

const AdminProfile = () => {
  const [adminId, setAdminId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdmin = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: adminError } = await supabase
          .from('admin_profile')
          .select('auth_Id')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (adminError) {
          setError(adminError.message || 'Failed to load admin profile');
          setAdminId(null);
        } else if (data?.auth_Id) {
          setAdminId(data.auth_Id);
        } else {
          setError('Admin profile not found.');
          setAdminId(null);
        }
      } catch (err) {
        setError(err.message || 'Failed to load admin profile');
        setAdminId(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdmin();
  }, []);

  if (isLoading) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1CACF3" />
          <Text style={styles.statusText}>Loading admin profile...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (error || !adminId) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Unable to open profile</Text>
          <Text style={styles.errorSubtitle}>{error || 'Admin profile not found.'}</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ProfileLayout
      profileUserId={adminId}
      profileRole="admin"
      readOnly
    />
  );
};

export default AdminProfile;

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  statusText: {
    marginTop: 12,
    fontSize: hp(1.6),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
  },
  errorTitle: {
    fontSize: hp(2),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: hp(2),
  },
});

