import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Facebook from "../assets/icons/Facebook";
import Insta from "../assets/icons/Insta";
import Language from "../assets/icons/Language";
import Location from "../assets/icons/Location";
import Logout from "../assets/icons/Logout";
import Verified from "../assets/icons/Verified";
import { hp } from "../helpers/common";
import { useGetProfileByRoleQuery } from "../redux/api/profileApi";
import { logout } from "../redux/slices/authSlice";
import { supabase } from "../supabaseClient";

export default function ProfileLayout() {
  const [showImagePopup, setShowImagePopup] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();

  const { user } = useSelector((state) => state.auth);
  
  // Fetch profile using RTK Query (cached, not persisted in Redux)
  const { data: profile, isLoading: isLoadingProfile } = useGetProfileByRoleQuery(
    { userId: user?.id, role: user?.role },
    { skip: !user?.id || !user?.role }
  );

  // State for signed URLs
  const [bannerImageSignedUrl, setBannerImageSignedUrl] = useState(null);
  const [userImageSignedUrl, setUserImageSignedUrl] = useState(null);

  // Default placeholder images
  const defaultBannerImage = "https://images.unsplash.com/photo-1697886720515-a50d1cff4c2f?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170";
  const defaultUserImage = "https://cdn.pixabay.com/photo/2023/02/18/11/00/icon-7797704_1280.png";

  // Extract file path from Supabase storage URL
  const extractFilePath = (url) => {
    if (!url) return null;
    try {
      // URL format: https://xxx.supabase.co/storage/v1/object/public/profile-attachments/school37/branch26/file.jpg
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

  // Generate signed URLs for existing images
  useEffect(() => {
    const generateSignedUrls = async () => {
      if (!profile) {
        setBannerImageSignedUrl(null);
        setUserImageSignedUrl(null);
        return;
      }

      // Generate signed URL for banner image
      if (profile.banner_Image) {
        const bannerImagePath = extractFilePath(profile.banner_Image);
        if (bannerImagePath) {
          try {
            const { data, error } = await supabase.storage
              .from("profile-attachments")
              .createSignedUrl(bannerImagePath, 3600);
            if (!error && data?.signedUrl) {
              setBannerImageSignedUrl(data.signedUrl);
            } else {
              setBannerImageSignedUrl(null);
            }
          } catch (e) {
            setBannerImageSignedUrl(null);
          }
        } else {
          setBannerImageSignedUrl(null);
        }
      } else {
        setBannerImageSignedUrl(null);
      }

      // Generate signed URL for user image
      if (profile.user_Image) {
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
          setUserImageSignedUrl(null);
        }
      } else {
        setUserImageSignedUrl(null);
      }
    };

    generateSignedUrls();
  }, [profile]);

  // Process profile data
  const userProfile = profile ? {
    fullName: profile.full_Name || "N/A",
    username: user?.email?.split("@")[0] || "user",
    role: user?.role || "user",
    about: profile.about || "No description available.",
    bannerImage: bannerImageSignedUrl || defaultBannerImage,
    userImage: userImageSignedUrl || null,
    email: profile.contact_Email || "N/A",
    phone: profile.phone || "N/A",
    dateOfBirth: profile.date_Of_Birth || null,
    languages: profile.language ? profile.language.split(",").map(l => l.trim()) : [],
    location: profile.location || "N/A",
    instaUrl: profile.instagram_Url || null,
    fbUrl: profile.facebook_Url || null,
    interest: profile.interest ? profile.interest.split(",").map(i => i.trim()) : [],
  } : {
    fullName: isLoadingProfile ? "Loading..." : "N/A",
    username: user?.email?.split("@")[0] || "user",
    role: user?.role || "user",
    about: isLoadingProfile ? "Loading profile..." : "No description available.",
    bannerImage: defaultBannerImage,
    userImage: null,
    email: user?.email || "N/A",
    phone: "N/A",
    dateOfBirth: null,
    languages: [],
    location: "N/A",
    instaUrl: null,
    fbUrl: null,
    interest: [],
  };

  const ImageSkeleton = ({ width, height, borderRadius = 0 }) => (
    <View
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: "#e5e7eb",
      }}
    />
  );

  const handleLogout = async () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await supabase.auth.signOut();
            dispatch(logout());
            router.replace("/");
          } catch (error) {
            Alert.alert("Error", error.message);
          }
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Banner Section */}
      <View style={[styles.bannerContainer, { height: hp(24) }]}>
        <Image
          transition={500}
          cachePolicy="disk"
          contentFit="cover"
          style={styles.bannerImage}
          source={{ uri: userProfile.bannerImage }}
          onError={() => {}}
        />
        <View style={styles.avatarContainer}>
          <View style={[styles.avatarWrapper, { height: hp(15.5), width: hp(15.5) }]}>
            <Pressable onPress={() => setShowImagePopup(true)}>
              {userProfile.userImage ? (
                <Image
                  transition={500}
                  cachePolicy={"disk"}
                  contentFit="cover"
                  style={styles.avatarImage}
                  source={{ uri: userProfile.userImage }}
                  onError={() => {}}
                />
              ) : (
                <View style={[styles.avatarImage, { backgroundColor: "#E5E7EB" }]} />
              )}
            </Pressable>
            <Text style={styles.usernameBadge}>
              @{userProfile.username}
            </Text>
          </View>
        </View>
      </View>

      {/* Profile Info */}
      <View style={[styles.profileInfo, { marginTop: hp(7) }]}>
        <View style={styles.nameRow}>
          <Text style={styles.fullName}>{userProfile.fullName}</Text>
          <View style={styles.verifiedIcon}>
            <Verified size={18} color="#1CACF3" strokeWidth={1.5} />
          </View>
        </View>
        {userProfile.role && (
          <Text style={styles.roleText}>
            {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}
          </Text>
        )}

        <View style={styles.infoRow}>
          {userProfile.languages.length > 0 && (
            <View style={styles.infoItem}>
              <Language size={14} color="#9ca3af" strokeWidth={1.5} />
              <Text style={styles.infoText}>
                {userProfile.languages.join(", ")}
              </Text>
            </View>
          )}
          {userProfile.location && userProfile.location !== "N/A" && (
            <View style={styles.infoItem}>
              <Location size={14} color="#9ca3af" strokeWidth={1.5} />
              <Text style={styles.infoText}>
                {userProfile.location}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonsRow}>
        <Pressable 
          style={styles.editButton}
          onPress={() => router.push('/screens/forms/editProfile')}
        >
          <Text style={styles.editButtonText}>
            Edit Profile
          </Text>
        </Pressable>

        <View style={styles.socialButtons}>
          <Pressable
            onPress={() => userProfile.instaUrl && Linking.openURL(userProfile.instaUrl)}
            style={[
              styles.socialButtonInsta,
              !userProfile.instaUrl && styles.socialButtonDisabled
            ]}
            disabled={!userProfile.instaUrl}
          >
            <Insta size={23} color={userProfile.instaUrl ? "#fff" : "#9CA3AF"} strokeWidth={1.5} />
          </Pressable>

          <Pressable
            onPress={() => userProfile.fbUrl && Linking.openURL(userProfile.fbUrl)}
            style={[
              styles.socialButtonFb,
              !userProfile.fbUrl && styles.socialButtonDisabled
            ]}
            disabled={!userProfile.fbUrl}
          >
            <Facebook size={23} color={userProfile.fbUrl ? "#fff" : "#9CA3AF"} strokeWidth={1.5} />
          </Pressable>
        </View>
      </View>

      {/* Contact Info */}
      <View style={styles.contentSection}>
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Email</Text>
          <Text style={styles.infoCardValue}>
            {userProfile.email}
          </Text>

          <View style={styles.infoCardSpacer}>
            <Text style={styles.infoCardTitle}>Phone</Text>
            <Text style={styles.infoCardValue}>
              {userProfile.phone}
            </Text>
          </View>

          {userProfile.dateOfBirth && (
            <View style={styles.infoCardSpacer}>
              <Text style={styles.infoCardTitle}>
                Date Of Birth
              </Text>
              <Text style={styles.infoCardValue}>
                {new Date(userProfile.dateOfBirth).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </Text>
            </View>
          )}
        </View>

        {/* About Section */}
        <View style={[styles.infoCard, styles.infoCardMargin]}>
          <Text style={styles.infoCardTitle}>About</Text>
          <Text style={styles.infoCardAbout}>
            {userProfile.about}
          </Text>
        </View>

        {/* Interests */}
        {userProfile.interest.length > 0 && (
          <View style={[styles.infoCard, styles.infoCardMargin]}>
            <Text style={styles.infoCardTitle}>Interests</Text>
            <View style={styles.interestsContainer}>
              {userProfile.interest.map((item, index) => (
                <Text
                  key={index}
                  style={styles.interestTag}
                >
                  {item}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Logout */}
        <Pressable
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          <Text style={styles.logoutText}>Logout</Text>
          <Logout size={22} color="#ef4444" strokeWidth={2} />
        </Pressable>
      </View>

      {/* Profile Image Popup Modal */}
      <Modal
        visible={showImagePopup}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImagePopup(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowImagePopup(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalImageContainer}>
              {userProfile.userImage ? (
                <Image
                  transition={500}
                  cachePolicy={"disk"}
                  contentFit="cover"
                  style={styles.modalImage}
                  source={{ uri: userProfile.userImage }}
                  onError={() => {}}
                />
              ) : (
                <View style={[styles.modalImage, { backgroundColor: "#E5E7EB" }]} />
              )}
              <View style={styles.modalInfo}>
                <Text style={styles.modalName}>
                  {userProfile.fullName}
                </Text>
                <Text style={styles.modalUsername}>
                  @{userProfile.username}
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  bannerContainer: {
    width: '100%',
    position: 'relative',
    marginBottom: hp(1.2),
  },
  bannerImage: {
    height: '100%',
    width: '100%',
  },
  avatarContainer: {
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -hp(7.75) }],
    bottom: -hp(8),
    alignItems: 'center',
  },
  avatarWrapper: {
    backgroundColor: '#FFFFFF',
    padding: 4,
    borderRadius: 9999,
  },
  avatarImage: {
    height: '100%',
    width: '100%',
    borderRadius: 100,
  },
  usernameBadge: {
    paddingHorizontal: 20,
    paddingVertical: 4,
    width: '100%',
    fontSize: hp(1.2),
    backgroundColor: '#F3F4F6',
    fontFamily: 'Poppins-Medium',
    fontWeight: '500',
    bottom: 24,
    textAlign: 'center',
    borderRadius: 12,
  },
  profileInfo: {
    alignItems: 'center',
    width: '90%',
    alignSelf: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fullName: {
    fontSize: 24,
    fontFamily: 'Poppins-SemiBold',
    fontWeight: '600',
  },
  verifiedIcon: {
    marginLeft: 2,
  },
  roleText: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
  },
  infoRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#9CA3AF',
    marginLeft: 4,
  },
  buttonsRow: {
    paddingHorizontal: 16,
    marginTop: 20,
    flexDirection: 'row',
  },
  editButton: {
    flex: 1,
    flexShrink: 0,
    backgroundColor: '#F3F4F6',
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  editButtonText: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    fontWeight: '600',
    color: '#6B7280',
  },
  socialButtons: {
    flexDirection: 'row',
  },
  socialButtonInsta: {
    backgroundColor: '#FC1BA8',
    flexShrink: 0,
    borderRadius: 9999,
    padding: 12,
    marginLeft: 8,
  },
  socialButtonFb: {
    backgroundColor: '#0077B5',
    flexShrink: 0,
    borderRadius: 9999,
    padding: 12,
    marginLeft: 8,
  },
  socialButtonDisabled: {
    backgroundColor: '#E5E7EB',
    opacity: 0.6,
  },
  contentSection: {
    paddingHorizontal: 16,
    marginVertical: 20,
  },
  infoCard: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  infoCardMargin: {
    marginTop: 20,
  },
  infoCardTitle: {
    fontSize: hp(1.6),
    fontFamily: 'Poppins-SemiBold',
    fontWeight: '600',
    color: '#4B5563',
  },
  infoCardValue: {
    fontSize: hp(1.6),
    fontFamily: 'Poppins-Medium',
    fontWeight: '500',
    color: '#6B7280',
  },
  infoCardSpacer: {
    marginTop: 8,
  },
  infoCardAbout: {
    fontSize: 14,
    marginTop: 8,
    fontFamily: 'Poppins-Medium',
    fontWeight: '500',
    color: '#6B7280',
  },
  interestsContainer: {
    flexDirection: 'row',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  interestTag: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Regular',
    color: '#4B5563',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 9999,
    marginRight: hp(1.2),
    marginBottom: hp(1.2),
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(254, 242, 242, 0.6)',
    borderWidth: 1,
    borderColor: '#EF4444',
    marginVertical: 20,
  },
  logoutText: {
    color: '#EF4444',
    fontFamily: 'Poppins-SemiBold',
    fontWeight: '600',
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginHorizontal: 16,
    width: '90%',
    maxWidth: '90%',
  },
  modalImageContainer: {
    alignItems: 'center',
  },
  modalImage: {
    borderRadius: 150,
    width: hp(28),
    height: hp(28),
  },
  modalInfo: {
    marginTop: 16,
    alignItems: 'center',
  },
  modalName: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    fontWeight: '700',
    color: '#1F2937',
  },
  modalUsername: {
    fontSize: 14,
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
    marginTop: 4,
  },
});
