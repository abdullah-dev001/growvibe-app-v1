import { Image } from 'expo-image';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { supabase } from '../../supabaseClient';
import { hp } from '../../helpers/common';

// Extract file path from Supabase storage URL
const extractFilePath = (url) => {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const bucketIndex = pathParts.findIndex(part => part === 'profile-attachments');
    if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
      return pathParts.slice(bucketIndex + 1).join('/');
    }
    return null;
  } catch (e) {
    return null;
  }
};

// Cache for signed URLs to avoid regenerating for the same image
const signedUrlCache = new Map();
const CACHE_EXPIRY = 3600000; // 1 hour in milliseconds

const SenderAvatar = React.memo(({ senderImage, senderName }) => {
  const [signedUrl, setSignedUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const imageUrlRef = useRef(null);

  useEffect(() => {
    // Skip if already processed for this image
    if (imageUrlRef.current === senderImage && signedUrl) {
      return;
    }

    // Reset if image changed
    if (imageUrlRef.current !== senderImage) {
      imageUrlRef.current = senderImage;
      setSignedUrl(null);
      setIsLoading(true);
    }

    // Skip if no image
    if (!senderImage) {
      setIsLoading(false);
      return;
    }

    // Check cache first
    const cached = signedUrlCache.get(senderImage);
    if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY) {
      setSignedUrl(cached.url);
      setIsLoading(false);
      return;
    }

    const generateSignedUrl = async () => {
      const filePath = extractFilePath(senderImage);
      if (!filePath) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.storage
          .from("profile-attachments")
          .createSignedUrl(filePath, 3600);
        
        if (!error && data?.signedUrl) {
          // Cache the signed URL
          signedUrlCache.set(senderImage, {
            url: data.signedUrl,
            timestamp: Date.now(),
          });
          setSignedUrl(data.signedUrl);
        }
      } catch (e) {
        // Error generating signed URL
      } finally {
        setIsLoading(false);
      }
    };

    generateSignedUrl();
  }, [senderImage, signedUrl]);

  if (isLoading || !signedUrl) {
    return (
      <View style={styles.senderAvatarPlaceholder}>
        <Text style={styles.senderAvatarText}>
          {senderName?.charAt(0)?.toUpperCase() || '?'}
        </Text>
      </View>
    );
  }

  return (
    <Image 
      source={{ uri: signedUrl }} 
      style={styles.senderAvatar}
      cachePolicy="disk"
      onError={() => {
        setSignedUrl(null);
        setIsLoading(false);
      }}
    />
  );
});

const styles = StyleSheet.create({
  senderAvatar: {
    width: hp(3),
    height: hp(3),
    borderRadius: hp(1.5),
    marginRight: 8,
  },
  senderAvatarPlaceholder: {
    width: hp(3),
    height: hp(3),
    borderRadius: hp(1.5),
    backgroundColor: '#1CACF3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  senderAvatarText: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
  },
});

export default SenderAvatar;

