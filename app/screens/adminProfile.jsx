import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import ProfileLayout from '../../components/ProfileLayout';
import ScreenWrapper from '../../components/ScreenWrapper';
import { hp } from '../../helpers/common';
import { supabase } from '../../supabaseClient';

// Error Boundary-like wrapper for React Native
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ProfileLayout Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ScreenWrapper>
          <View style={styles.center}>
            <Text style={styles.errorTitle}>Unable to display profile</Text>
            <Text style={styles.errorSubtitle}>
              {this.state.error?.message || 'An error occurred while loading the profile. Please try again.'}
            </Text>
          </View>
        </ScreenWrapper>
      );
    }

    return this.props.children;
  }
}

const AdminProfile = () => {
  const [adminId, setAdminId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchAdmin = async () => {
      if (!isMounted) return;
      
      setIsLoading(true);
      setError(null);
      setHasError(false);
      
      try {
        const { data, error: adminError } = await supabase
          .from('admin_profile')
          .select('auth_Id')
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (!isMounted) return;

        if (adminError) {
          setError(adminError.message || 'Failed to load admin profile');
          setAdminId(null);
          setHasError(true);
        } else if (data?.auth_Id) {
          // Validate the auth_Id before setting
          if (typeof data.auth_Id === 'string' && data.auth_Id.trim().length > 0) {
            setAdminId(data.auth_Id);
            setHasError(false);
            // Add a small delay to ensure state is ready
            setTimeout(() => setIsReady(true), 100);
          } else {
            setError('Invalid admin profile ID.');
            setAdminId(null);
            setHasError(true);
          }
        } else {
          setError('Admin profile not found.');
          setAdminId(null);
          setHasError(true);
        }
      } catch (err) {
        if (!isMounted) return;
        console.log('Error fetching admin profile:', err);
        setError(err?.message || 'Failed to load admin profile');
        setAdminId(null);
        setHasError(true);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAdmin();

    return () => {
      isMounted = false;
    };
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

  if (hasError || (!isLoading && !adminId)) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Unable to open profile</Text>
          <Text style={styles.errorSubtitle}>{error || 'Admin profile not found.'}</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!adminId) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1CACF3" />
          <Text style={styles.statusText}>Loading admin profile...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  // Safety check before rendering ProfileLayout
  if (!adminId || typeof adminId !== 'string' || !adminId.trim()) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Unable to display profile</Text>
          <Text style={styles.errorSubtitle}>Invalid admin profile data. Please try again.</Text>
        </View>
      </ScreenWrapper>
    );
  }

  // Wait until ready to prevent race conditions
  if (!isReady) {
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1CACF3" />
          <Text style={styles.statusText}>Preparing profile...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  // Wrap ProfileLayout in ErrorBoundary to catch any rendering errors
  try {
    return (
      <ErrorBoundary>
        <ProfileLayout
          profileUserId={adminId}
          profileRole="admin"
          readOnly
        />
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('AdminProfile: Error rendering ProfileLayout:', error);
    return (
      <ScreenWrapper>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Unable to display profile</Text>
          <Text style={styles.errorSubtitle}>
            {error?.message || 'An error occurred. Please try again.'}
          </Text>
        </View>
      </ScreenWrapper>
    );
  }
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

