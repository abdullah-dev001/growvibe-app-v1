import { Image } from "expo-image";
import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";
import { hp } from "../helpers/common";
import { useGetProfileByRoleQuery } from "../redux/api/profileApi";
import { supabase } from "../supabaseClient";

export default function Topbar() {
  const { user } = useSelector((state) => state.auth);
  
  // Fetch profile using RTK Query
  const { data: profile } = useGetProfileByRoleQuery(
    { userId: user?.id, role: user?.role },
    { skip: !user?.id || !user?.role }
  );

  // Get school logo based on role
  const [schoolLogoPath, setSchoolLogoPath] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSchoolLogo = async () => {
      if (user?.role === 'owner' && profile?.auth_Id) {
        // For owners, fetch school_Logo directly using owner_Id (auth_Id)
        try {
          const { data, error } = await supabase
            .from('school')
            .select('school_Logo')
            .eq('owner_Id', profile.auth_Id)
            .limit(1)
            .maybeSingle();
          
          if (isMounted) {
            if (!error && data?.school_Logo) {
              setSchoolLogoPath(data.school_Logo);
            } else {
              setSchoolLogoPath(null);
            }
          }
        } catch (e) {
          if (isMounted) setSchoolLogoPath(null);
        }
      } else if (profile?.school_Id) {
        // For other roles, fetch school data using school_Id
        try {
          const { data, error } = await supabase
            .from('school')
            .select('school_Logo')
            .eq('id', profile.school_Id)
            .limit(1)
            .maybeSingle();
          
          if (isMounted) {
            if (!error && data?.school_Logo) {
              setSchoolLogoPath(data.school_Logo);
            } else {
              setSchoolLogoPath(null);
            }
          }
        } catch (e) {
          if (isMounted) setSchoolLogoPath(null);
        }
      } else {
        if (isMounted) setSchoolLogoPath(null);
      }
    };

    fetchSchoolLogo();

    return () => {
      isMounted = false;
    };
  }, [profile?.school_Id, profile?.auth_Id, user?.role]);

  const [userImageSignedUrl, setUserImageSignedUrl] = useState(null);
  const [schoolLogoSignedUrl, setSchoolLogoSignedUrl] = useState(null);

  // Extract file path from Supabase storage URL
  const extractFilePath = (url, bucketName) => {
    if (!url) return null;
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      
      // Handle Supabase storage URLs
      const publicIndex = pathParts.findIndex(part => part === 'storage');
      if (publicIndex !== -1) {
        const bucketIndex = pathParts.findIndex(part => part === bucketName);
        if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
          return pathParts.slice(bucketIndex + 1).join('/');
        }
      }
      
      // Try direct pattern
      const bucketIndex = pathParts.findIndex(part => part === bucketName);
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        return pathParts.slice(bucketIndex + 1).join('/');
      }
      
      return null;
    } catch (e) {
      return null;
    }
  };

  // Generate signed URL for user image
  useEffect(() => {
    let isMounted = true;

    const generateSignedUrl = async () => {
      if (!profile?.user_Image) {
        if (isMounted) setUserImageSignedUrl(null);
        return;
      }

      const userImagePath = extractFilePath(profile.user_Image, 'profile-attachments');
      if (userImagePath) {
        try {
          const { data, error } = await supabase.storage
            .from("profile-attachments")
            .createSignedUrl(userImagePath, 3600);
          if (isMounted) {
            if (!error && data?.signedUrl) {
              setUserImageSignedUrl(data.signedUrl);
            } else {
              setUserImageSignedUrl(null);
            }
          }
        } catch (e) {
          if (isMounted) setUserImageSignedUrl(null);
        }
      } else {
        // If we can't extract path, try using the URL directly
        if (isMounted) setUserImageSignedUrl(profile.user_Image);
      }
    };

    generateSignedUrl();

    return () => {
      isMounted = false;
    };
  }, [profile?.user_Image]);

  // Generate signed URL for school logo
  useEffect(() => {
    let isMounted = true;

    const generateSchoolLogoSignedUrl = async () => {
      if (!schoolLogoPath) {
        if (isMounted) setSchoolLogoSignedUrl(null);
        return;
      }

      // school_Logo format: "school-logos/{schoolId}.{ext}" (e.g., "school-logos/5.jpg")
      let logoPath = schoolLogoPath;
      
      // If it's a full URL, extract the path
      if (logoPath && logoPath.includes('http')) {
        logoPath = extractFilePath(logoPath, 'school-logos');
      }
      
      // Remove 'school-logos/' prefix if present (since we specify bucket in from())
      if (logoPath && logoPath.startsWith('school-logos/')) {
        logoPath = logoPath.replace('school-logos/', '');
      }

      // Ensure we have a valid path (should be like "5.jpg" or just filename)
      if (logoPath && logoPath.length > 0) {
        try {
          const { data, error } = await supabase.storage
            .from("school-logos")
            .createSignedUrl(logoPath, 3600);
          if (isMounted) {
            if (!error && data?.signedUrl) {
              setSchoolLogoSignedUrl(data.signedUrl);
            } else {
              setSchoolLogoSignedUrl(null);
            }
          }
        } catch (e) {
          if (isMounted) setSchoolLogoSignedUrl(null);
        }
      } else {
        if (isMounted) setSchoolLogoSignedUrl(null);
      }
    };

    generateSchoolLogoSignedUrl();

    return () => {
      isMounted = false;
    };
  }, [schoolLogoPath]);

  const displayImage = userImageSignedUrl || profile?.user_Image;
  const userName = profile?.full_Name || user?.email?.split('@')[0] || 'U';
  const defaultLogo = require("../assets/screens-assets/growvibe-light.png");
  const logoSource = schoolLogoSignedUrl 
    ? { uri: schoolLogoSignedUrl } 
    : defaultLogo;

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
      <Image
        transition={500}
        cachePolicy={"disk"}
        contentFit="contain"
        style={styles.logo}
        source={logoSource}
        onError={() => {
          setSchoolLogoSignedUrl(null);
        }}
      />
      </View>

      <Pressable style={styles.avatarContainer}>
        {displayImage ? (
          <Image
            transition={500}
            cachePolicy={"disk"}
            contentFit="cover"
            style={styles.avatar}
            source={{ uri: displayImage }}
          />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarPlaceholderText}>
              {userName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  logoContainer: {
    width: hp(6),
    height: hp(6),
    objectFit: 'contain',
    borderRadius: hp(1),
    overflow: 'hidden',
  },
  logo: {
    height: '100%',
    width: '100%',
  },
  avatarContainer: {
    borderRadius: 9999,
    overflow: 'hidden',
    height: hp(4.4),
    width: hp(4.4),
  },
  avatar: {
    height: '100%',
    width: '100%',
    borderRadius: 100,
  },
  avatarPlaceholder: {
    height: '100%',
    width: '100%',
    borderRadius: 100,
    backgroundColor: '#1CACF3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: hp(1.8),
    fontFamily: 'Poppins-SemiBold',
    color: '#FFFFFF',
  },
});
