import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import ProfileLayout from '../../components/ProfileLayout';

const ViewProfile = () => {
  const params = useLocalSearchParams();
  const userId = params.userId ? String(params.userId) : null;
  const role = params.role ? String(params.role) : null;

  return (
    <ProfileLayout
      profileUserId={userId}
      profileRole={role}
      readOnly
    />
  );
};

export default ViewProfile;

