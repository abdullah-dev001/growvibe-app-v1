import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';

export const useAuth = () => {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated && user) {
        // User is logged in, redirect to home
        router.replace('/(tabs)/(common)/home');
      } else {
        // User is not logged in, redirect to login
        router.replace('/login');
      }
    }
  }, [isAuthenticated, loading, user]);

  return {
    user,
    isAuthenticated,
    loading,
  };
};
