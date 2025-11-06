import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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
import { useDispatch } from "react-redux";
import Facebook from "../assets/icons/Facebook";
import Insta from "../assets/icons/Insta";
import Language from "../assets/icons/Language";
import Location from "../assets/icons/Location";
import Logout from "../assets/icons/Logout";
import Verified from "../assets/icons/Verified";
import { hp } from "../helpers/common";
import { logout } from "../redux/slices/authSlice";
import { supabase } from "../supabaseClient";

export default function ProfileLayout() {
  const [showImagePopup, setShowImagePopup] = useState(false);
  const dispatch = useDispatch();
  const router = useRouter();

  const userProfile = {
    fullName: "Abdullah Khan",
    username: "abdullah_dev",
    role: "admin",
    about:
      "I am a passionate web developer with a love for building sleek, functional interfaces that enhance user experience.",
    bannerImage:
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
    userImage:
      "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=500&q=80",
    email: "abdullah@example.com",
    phone: "+92 301 1234567",
    dateOfBirth: "1998-05-12",
    languages: ["English", "Urdu"],
    location: "Lahore, Pakistan",
    instaUrl: "https://instagram.com/",
    fbUrl: "https://facebook.com/",
    interest: ["UI Design", "React", "GSAP Animations", "Open Source"],
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
          cachePolicy={"disk"}
          contentFit="cover"
          style={styles.bannerImage}
          source={userProfile.bannerImage}
        />
        <View style={styles.avatarContainer}>
          <View style={[styles.avatarWrapper, { height: hp(15.5), width: hp(15.5) }]}>
            <Pressable onPress={() => setShowImagePopup(true)}>
              <Image
                transition={500}
                cachePolicy={"disk"}
                contentFit="cover"
                style={styles.avatarImage}
                source={userProfile.userImage}
              />
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
        <Text style={styles.roleText}>
          Founder of Growvibe
        </Text>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Language size={14} color="#9ca3af" strokeWidth={1.5} />
            <Text style={styles.infoText}>
              {userProfile.languages.join(", ")}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Location size={14} color="#9ca3af" strokeWidth={1.5} />
            <Text style={styles.infoText}>
              {userProfile.location}
            </Text>
          </View>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonsRow}>
        <Pressable style={styles.editButton}>
          <Text style={styles.editButtonText}>
            Edit Profile
          </Text>
        </Pressable>

        <View style={styles.socialButtons}>
          <Pressable
            onPress={() => Linking.openURL(userProfile.instaUrl)}
            style={styles.socialButtonInsta}
          >
            <Insta size={23} color="#fff" strokeWidth={1.5} />
          </Pressable>

          <Pressable
            onPress={() => Linking.openURL(userProfile.fbUrl)}
            style={styles.socialButtonFb}
          >
            <Facebook size={23} color="#fff" strokeWidth={1.5} />
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
        </View>

        {/* About Section */}
        <View style={[styles.infoCard, styles.infoCardMargin]}>
          <Text style={styles.infoCardTitle}>About</Text>
          <Text style={styles.infoCardAbout}>
            {userProfile.about}
          </Text>
        </View>

        {/* Interests */}
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
              <Image
                transition={500}
                cachePolicy={"disk"}
                contentFit="cover"
                style={styles.modalImage}
                source={userProfile.userImage}
              />
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
