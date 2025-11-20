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

  const [userImageSignedUrl, setUserImageSignedUrl] = useState(null);

  // Extract file path from Supabase storage URL
  const extractFilePath = (url) => {
    if (!url) return null;
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      
      // Handle Supabase storage URLs
      const publicIndex = pathParts.findIndex(part => part === 'storage');
      if (publicIndex !== -1) {
        const profileIndex = pathParts.findIndex(part => part === 'profile-attachments');
        if (profileIndex !== -1 && profileIndex < pathParts.length - 1) {
          return pathParts.slice(profileIndex + 1).join('/');
        }
      }
      
      // Try direct pattern
      const bucketIndex = pathParts.findIndex(part => part === 'profile-attachments');
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
    const generateSignedUrl = async () => {
      if (!profile?.user_Image) {
        setUserImageSignedUrl(null);
        return;
      }

      const userImagePath = extractFilePath(profile.user_Image);
      if (userImagePath) {
        try {
          const { data, error } = await supabase.storage
            .from("profile-attachments")
            .createSignedUrl(userImagePath, 3600);
          if (!error && data?.signedUrl) {
            setUserImageSignedUrl(data.signedUrl);
          } else {
            setUserImageSignedUrl(null);
          }
        } catch (e) {
          setUserImageSignedUrl(null);
        }
      } else {
        // If we can't extract path, try using the URL directly
        setUserImageSignedUrl(profile.user_Image);
      }
    };

    generateSignedUrl();
  }, [profile?.user_Image]);

  const displayImage = userImageSignedUrl || profile?.user_Image;
  const userName = profile?.full_Name || user?.email?.split('@')[0] || 'U';

  return (
    <View style={styles.container}>
      <Image
        transition={500}
        cachePolicy={"disk"}
        contentFit="contain"
        style={styles.logo}
        source={require("../assets/screens-assets/growvibe-light.png")}
      />

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
  logo: {
    height: hp(8),
    width: hp(8),
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
