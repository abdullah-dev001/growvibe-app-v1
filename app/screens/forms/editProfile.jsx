import DateTimePicker from "@react-native-community/datetimepicker";
import { decode } from "base64-arraybuffer";
import * as FileSystem from "expo-file-system/legacy";
import { Image } from "expo-image";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Formik } from "formik";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelector } from "react-redux";
import * as Yup from "yup";
import Button from "../../../components/Button";
import Input from "../../../components/Input";
import ScreenWrapper from "../../../components/ScreenWrapper";
import { hp } from "../../../helpers/common";
import { useGetProfileByRoleQuery, useUpdateProfileMutation } from "../../../redux/api/profileApi";
import { supabase } from "../../../supabaseClient";

// Validation Schema
const validationSchema = Yup.object().shape({
  full_Name: Yup.string()
    .required("Full name is required")
    .min(2, "Full name must be at least 2 characters"),
  phone: Yup.string(),
  contact_Email: Yup.string().email("Invalid email address"),
  instagram_Url: Yup.string().url("Invalid Instagram URL"),
  facebook_Url: Yup.string().url("Invalid Facebook URL"),
  about: Yup.string(),
  interest: Yup.string(),
  location: Yup.string(),
  language: Yup.string(),
  gender: Yup.string(),
  date_Of_Birth: Yup.string(),
});

const editProfile = () => {
  const router = useRouter();
  const { user, schoolId, branchId } = useSelector((state) => state.auth);
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const { data: profileData, isLoading: isLoadingProfile } = useGetProfileByRoleQuery(
    { userId: user?.id, role: user?.role },
    { skip: !user?.id || !user?.role }
  );

  const [userImage, setUserImage] = useState(null);
  const [bannerImage, setBannerImage] = useState(null);
  const [userImageSignedUrl, setUserImageSignedUrl] = useState(null);
  const [bannerImageSignedUrl, setBannerImageSignedUrl] = useState(null);
  const [oldUserImageUrl, setOldUserImageUrl] = useState(null); // Track old image URL for deletion
  const [oldBannerImageUrl, setOldBannerImageUrl] = useState(null); // Track old image URL for deletion
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDateOfBirth, setTempDateOfBirth] = useState(new Date());
  const [interests, setInterests] = useState([]); // Array of interest tags
  const [interestInput, setInterestInput] = useState(""); // Temporary input for adding interests

  // Extract file path from Supabase storage URL (handles both admin and school/branch paths)
  const extractFilePath = (url) => {
    if (!url) return null;
    try {
      // URL format: https://xxx.supabase.co/storage/v1/object/public/profile-attachments/path/to/file.jpg
      // Can be: admin/attachments/file.jpg or school37/branch26/file.jpg
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
      if (!profileData) {
        setUserImageSignedUrl(null);
        setBannerImageSignedUrl(null);
        return;
      }

      // Generate signed URL for user image
      if (profileData.user_Image) {
        setOldUserImageUrl(profileData.user_Image); // Track old URL for deletion
        const userImagePath = extractFilePath(profileData.user_Image);
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
        setOldUserImageUrl(null);
      }

      // Generate signed URL for banner image
      if (profileData.banner_Image) {
        setOldBannerImageUrl(profileData.banner_Image); // Track old URL for deletion
        const bannerImagePath = extractFilePath(profileData.banner_Image);
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
        setOldBannerImageUrl(null);
      }

      // Parse interests from comma-separated string to array
      if (profileData?.interest) {
        const interestsArray = profileData.interest
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item.length > 0);
        setInterests(interestsArray);
      } else {
        setInterests([]);
      }
    };

    generateSignedUrls();
  }, [profileData]);

  const formatDateForInput = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handlePickImage = async (type) => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please grant camera roll permissions to select images");
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
        allowsMultipleSelection: false,
      });

      if (result.canceled) return;
      const asset = result.assets[0];

      if (!asset) return;

      // Target file sizes
      const maxSize = type === "banner" ? 100 * 1024 : 50 * 1024; // 100KB for banner, 50KB for profile
      const maxWidth = type === "banner" ? 1200 : 600; // Smaller dimensions for better compression

      // Compress and resize image with progressive quality reduction
      let compressedImage;
      let quality = 0.8; // Start with 80% quality
      let attempts = 0;
      const maxAttempts = 10;

      try {
        while (attempts < maxAttempts) {
          // Set resize action based on type
          const actions = [{ resize: { width: maxWidth } }];

          compressedImage = await ImageManipulator.manipulateAsync(
            asset.uri,
            actions,
            {
              compress: quality,
              format: ImageManipulator.SaveFormat.JPEG,
            }
          );

          // Check file size
          if (compressedImage.uri) {
            const fileInfo = await FileSystem.getInfoAsync(compressedImage.uri);
            if (fileInfo.exists && fileInfo.size && fileInfo.size <= maxSize) {
              // File size is acceptable
              break;
            } else if (fileInfo.size && fileInfo.size > maxSize) {
              // File is still too large, reduce quality
              quality = Math.max(0.1, quality - 0.1); // Reduce by 10%, minimum 10%
              attempts++;
              
              // If we've tried multiple times and still too large, try smaller dimensions
              if (attempts >= 5) {
                const smallerWidth = type === "banner" ? 800 : 400;
                compressedImage = await ImageManipulator.manipulateAsync(
                  asset.uri,
                  [{ resize: { width: smallerWidth } }],
                  {
                    compress: quality,
                    format: ImageManipulator.SaveFormat.JPEG,
                  }
                );
                const newFileInfo = await FileSystem.getInfoAsync(compressedImage.uri);
                if (newFileInfo.exists && newFileInfo.size && newFileInfo.size <= maxSize) {
                  break;
                }
              }
            } else {
              // File size check failed, but continue with current image
              break;
            }
          } else {
            break;
          }
        }

        // Final check - if still too large, use minimum quality
        if (compressedImage.uri) {
          const fileInfo = await FileSystem.getInfoAsync(compressedImage.uri);
          if (fileInfo.exists && fileInfo.size && fileInfo.size > maxSize) {
            // Last attempt with minimum dimensions and quality
            const minWidth = type === "banner" ? 600 : 300;
            compressedImage = await ImageManipulator.manipulateAsync(
              asset.uri,
              [{ resize: { width: minWidth } }],
              {
                compress: 0.3, // Very low quality
                format: ImageManipulator.SaveFormat.JPEG,
              }
            );
          }
        }
      } catch (compressError) {
        Alert.alert("Error", "Failed to compress image. Please try selecting a different image.");
        return;
      }

      // Get file extension from URI or use default
      const uriParts = compressedImage.uri.split(".");
      const fileExt = uriParts.length > 1 ? `.${uriParts[uriParts.length - 1]}` : ".jpg";
      const fileName = `${type}-${Date.now()}${fileExt}`;

      const imageData = {
        uri: compressedImage.uri,
        name: fileName,
        size: compressedImage.width && compressedImage.height ? (compressedImage.width * compressedImage.height * 0.7) : 0,
        type: "image/jpeg",
      };

      if (type === "user") {
        setUserImage(imageData);
        setUserImageSignedUrl(null); // Clear signed URL when new image is selected
      } else {
        setBannerImage(imageData);
        setBannerImageSignedUrl(null); // Clear signed URL when new image is selected
      }
    } catch (e) {
      Alert.alert("Error", e?.message || "Failed to pick image");
    }
  };

  // Delete old image from Supabase storage
  const deleteOldImage = async (imageUrl) => {
    if (!imageUrl) return;
    
    try {
      const filePath = extractFilePath(imageUrl);
      if (!filePath) return;

      const { error } = await supabase.storage
        .from("profile-attachments")
        .remove([filePath]);

      if (error) {
        // Silently fail - old image deletion is not critical
      }
    } catch (e) {
      // Silently fail - old image deletion is not critical
    }
  };

  const uploadImageIfNeeded = async (image, type) => {
    // If no new image was selected, don't touch existing storage here.
    // We only decide to keep/remove the old image inside handleSubmit.
    if (!image) {
      return null;
    }

    // Admin users don't need schoolId, but other roles do
    if (user?.role !== "admin" && !schoolId) {
      Alert.alert("Error", "SchoolId is required to upload images");
      return null;
    }

    try {
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(image.uri);
      if (!fileInfo.exists) {
        Alert.alert("Error", "Selected file no longer exists. Please select the file again.");
        return null;
      }

      // Read file as base64 using legacy API
      const base64 = await FileSystem.readAsStringAsync(image.uri, {
        encoding: 'base64',
      });

      if (!base64 || base64.length === 0) {
        Alert.alert("Error", "Failed to read file content. The file may be corrupted or inaccessible.");
        return null;
      }

      // Convert base64 to ArrayBuffer using base64-arraybuffer
      let arrayBuffer;
      try {
        arrayBuffer = decode(base64);
      } catch (decodeError) {
        Alert.alert("Error", "Failed to process file for upload. Please try a different file.");
        return null;
      }

      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        Alert.alert("Error", "File is empty or could not be processed.");
        return null;
      }

      const fileExt = image.name.includes(".")
        ? image.name.substring(image.name.lastIndexOf("."))
        : "";
      
      // Use different folder structure for admin users
      let filePath;
      if (user?.role === "admin") {
        filePath = `admin/attachments/profile-${type}-${Date.now()}${fileExt}`;
      } else {
        const branchPart = branchId ? `branch${branchId}` : "branch-general";
        filePath = `school${schoolId}/${branchPart}/profile-${type}-${Date.now()}${fileExt}`;
      }

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from("profile-attachments")
        .upload(filePath, arrayBuffer, {
          contentType: image.type || "image/jpeg",
          upsert: false,
        });

      if (error) {
        const errorMsg = error.message || "Unknown error occurred";
        Alert.alert(
          "Upload Failed",
          `Could not upload ${type} image: ${errorMsg}\n\nThe profile will be updated without the ${type} image.`,
          [{ text: "OK" }]
        );
        return null;
      }

      if (!data) {
        Alert.alert(
          "Upload Warning",
          `Upload completed but no confirmation received. The profile will be updated, but the ${type} image may not be available.`
        );
        return null;
      }

      // Get public URL
      const { data: publicData } = supabase.storage
        .from("profile-attachments")
        .getPublicUrl(filePath);

      const publicUrl = publicData?.publicUrl;
      if (!publicUrl) {
        Alert.alert(
          "Upload Warning",
          `File uploaded but public URL could not be generated. The profile will be updated.`
        );
        return filePath; // Return the path as fallback
      }

      return publicUrl;
    } catch (e) {
      const errorMessage = e?.message || "Unknown error occurred";
      Alert.alert(
        "Upload Error",
        `Failed to upload ${type} image: ${errorMessage}\n\nThe profile will be updated without the ${type} image.`,
        [{ text: "OK" }]
      );
      return null;
    }
  };

  const handleDateChange = (event, selectedDate, setFieldValue) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setTempDateOfBirth(selectedDate);
      if (Platform.OS === "android") {
        const formattedDate = formatDateForInput(selectedDate);
        setFieldValue("date_Of_Birth", formattedDate);
      }
    }
  };

  const confirmDate = (setFieldValue) => {
    const formattedDate = formatDateForInput(tempDateOfBirth);
    setFieldValue("date_Of_Birth", formattedDate);
    setShowDatePicker(false);
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      if (!user?.id || !user?.role) {
        Alert.alert("Error", "User information is missing");
        return;
      }

      // Upload images if needed
      const userImageUrl = await uploadImageIfNeeded(userImage, "user");
      const bannerImageUrl = await uploadImageIfNeeded(bannerImage, "banner");

      // Prepare profile data
      const profileUpdateData = {
        full_Name: values.full_Name,
        phone: values.phone || null,
        contact_Email: values.contact_Email || null,
        instagram_Url: values.instagram_Url || null,
        facebook_Url: values.facebook_Url || null,
        about: values.about || null,
        interest: interests.length > 0 ? interests.join(", ") : null,
        location: values.location || null,
        language: values.language || null,
        gender: values.gender || null,
        date_Of_Birth: values.date_Of_Birth || null,
      };

      // Handle image URLs: update if new image uploaded, preserve existing if not changed, set to null if removed
      if (userImageUrl) {
        // New image was uploaded
        profileUpdateData.user_Image = userImageUrl;
        // Delete old image from storage
        if (oldUserImageUrl) {
          await deleteOldImage(oldUserImageUrl);
        }
      } else if (userImageSignedUrl) {
        // Image is still showing (user didn't remove it), preserve the existing URL
        profileUpdateData.user_Image = oldUserImageUrl;
      } else if (oldUserImageUrl && !userImageSignedUrl) {
        // Image was removed (old image existed but signed URL is cleared), set to null
        profileUpdateData.user_Image = null;
        await deleteOldImage(oldUserImageUrl);
      }

      if (bannerImageUrl) {
        // New image was uploaded
        profileUpdateData.banner_Image = bannerImageUrl;
        // Delete old image from storage
        if (oldBannerImageUrl) {
          await deleteOldImage(oldBannerImageUrl);
        }
      } else if (bannerImageSignedUrl) {
        // Image is still showing (user didn't remove it), preserve the existing URL
        profileUpdateData.banner_Image = oldBannerImageUrl;
      } else if (oldBannerImageUrl && !bannerImageSignedUrl) {
        // Image was removed (old image existed but signed URL is cleared), set to null
        profileUpdateData.banner_Image = null;
        await deleteOldImage(oldBannerImageUrl);
      }

      await updateProfile({
        role: user.role,
        userId: user.id,
        profileData: profileUpdateData,
      }).unwrap();

      Alert.alert("Success", "Profile updated successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to update profile. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContentContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Edit Profile</Text>
              <Text style={styles.headerSubtitle}>
                Update your profile information
              </Text>
            </View>

            {isLoadingProfile ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading profile data...</Text>
              </View>
            ) : (
              <Formik
                key={profileData ? `profile-${profileData.id || user?.id}` : 'new-profile'}
                initialValues={{
                  full_Name: profileData?.full_Name || "",
                  phone: profileData?.phone || "",
                  contact_Email: profileData?.contact_Email || "",
                  instagram_Url: profileData?.instagram_Url || "",
                  facebook_Url: profileData?.facebook_Url || "",
                  about: profileData?.about || "",
                  interest: "", // Not used directly, interests array is managed separately
                  location: profileData?.location || "",
                  language: profileData?.language || "",
                  gender: profileData?.gender || "Male",
                  date_Of_Birth: profileData?.date_Of_Birth ? formatDateForInput(new Date(profileData.date_Of_Birth)) : "",
                }}
                enableReinitialize
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
              >
                {({
                  values,
                  errors,
                  touched,
                  handleChange,
                  handleBlur,
                  setFieldValue,
                  handleSubmit: formikSubmit,
                  isSubmitting,
                }) => (
                  <>
                    {/* Form Fields */}
                    <View style={styles.formFields}>
                      {/* Banner Image */}
                      <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>Banner Image</Text>
                        <TouchableOpacity
                          onPress={() => handlePickImage("banner")}
                          style={styles.imagePickerButton}
                        >
                          {bannerImage ? (
                            <Image
                              source={{ uri: bannerImage.uri }}
                              style={styles.imagePreview}
                              contentFit="cover"
                              transition={200}
                              cachePolicy="memory"
                            />
                          ) : bannerImageSignedUrl ? (
                            <Image
                              source={{ uri: bannerImageSignedUrl }}
                              style={styles.imagePreview}
                              contentFit="cover"
                              transition={200}
                              cachePolicy="disk"
                              onError={() => {}}
                            />
                          ) : (
                            <View style={[styles.imagePreview, styles.imagePlaceholder]}>
                              <Text style={styles.imagePlaceholderText}>Tap to select banner image</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                        {(bannerImage || bannerImageSignedUrl) && (
                          <TouchableOpacity
                            onPress={async () => {
                              // Clear the displayed images but keep oldBannerImageUrl to track removal
                              setBannerImage(null);
                              setBannerImageSignedUrl(null);
                              // Note: We don't delete from storage here or clear oldBannerImageUrl
                              // The deletion and null setting will happen on form submit
                            }}
                            style={styles.removeImageButton}
                          >
                            <Text style={styles.removeImageText}>Remove Banner</Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* User Image */}
                      <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>Profile Image</Text>
                        <TouchableOpacity
                          onPress={() => handlePickImage("user")}
                          style={styles.imagePickerButton}
                        >
                          {userImage ? (
                            <Image
                              source={{ uri: userImage.uri }}
                              style={[styles.imagePreview, styles.userImagePreview]}
                              contentFit="cover"
                              transition={200}
                              cachePolicy="memory"
                            />
                          ) : userImageSignedUrl ? (
                            <Image
                              source={{ uri: userImageSignedUrl }}
                              style={[styles.imagePreview, styles.userImagePreview]}
                              contentFit="cover"
                              transition={200}
                              cachePolicy="disk"
                              onError={() => {}}
                            />
                          ) : (
                            <View style={[styles.imagePreview, styles.userImagePreview, styles.imagePlaceholder]}>
                              <Text style={styles.imagePlaceholderText}>Tap to select profile image</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                        {(userImage || userImageSignedUrl) && (
                          <TouchableOpacity
                            onPress={async () => {
                              // Clear the displayed images but keep oldUserImageUrl to track removal
                              setUserImage(null);
                              setUserImageSignedUrl(null);
                              // Note: We don't delete from storage here or clear oldUserImageUrl
                              // The deletion and null setting will happen on form submit
                            }}
                            style={styles.removeImageButton}
                          >
                            <Text style={styles.removeImageText}>Remove Profile Image</Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Full Name */}
                      <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>Full Name *</Text>
                        <Input
                          placeholder="Enter your full name"
                          value={values.full_Name}
                          onChangeText={handleChange("full_Name")}
                          onBlur={handleBlur("full_Name")}
                          type="text"
                        />
                        {touched.full_Name && errors.full_Name && (
                          <Text style={styles.errorText}>{errors.full_Name}</Text>
                        )}
                      </View>

                      {/* Phone */}
                      <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>Phone</Text>
                        <Input
                          placeholder="Enter your phone number"
                          value={values.phone}
                          onChangeText={handleChange("phone")}
                          onBlur={handleBlur("phone")}
                          type="text"
                          keyboardType="phone-pad"
                        />
                        {touched.phone && errors.phone && (
                          <Text style={styles.errorText}>{errors.phone}</Text>
                        )}
                      </View>

                      {/* Contact Email */}
                      <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>Contact Email</Text>
                        <Input
                          placeholder="Enter your contact email"
                          value={values.contact_Email}
                          onChangeText={handleChange("contact_Email")}
                          onBlur={handleBlur("contact_Email")}
                          type="text"
                          keyboardType="email-address"
                        />
                        {touched.contact_Email && errors.contact_Email && (
                          <Text style={styles.errorText}>{errors.contact_Email}</Text>
                        )}
                      </View>

                      {/* Gender */}
                      <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>Gender</Text>
                        <View style={styles.genderRow}>
                          <TouchableOpacity
                            onPress={() => setFieldValue("gender", "Male")}
                            style={[
                              styles.genderButton,
                              { flex: 1 },
                              values.gender === "Male" && styles.genderButtonActive
                            ]}
                          >
                            <Text
                              style={[
                                styles.genderButtonText,
                                { color: values.gender === "Male" ? "#10B981" : "#6B7280" }
                              ]}
                            >
                              Male
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => setFieldValue("gender", "Female")}
                            style={[
                              styles.genderButton,
                              { flex: 1, marginLeft: 12 },
                              values.gender === "Female" && styles.genderButtonActive
                            ]}
                          >
                            <Text
                              style={[
                                styles.genderButtonText,
                                { color: values.gender === "Female" ? "#10B981" : "#6B7280" }
                              ]}
                            >
                              Female
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Date of Birth */}
                      <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>Date of Birth</Text>
                        <TouchableOpacity
                          onPress={() => {
                            if (values.date_Of_Birth) {
                              setTempDateOfBirth(new Date(values.date_Of_Birth));
                            } else {
                              setTempDateOfBirth(new Date());
                            }
                            setShowDatePicker(true);
                          }}
                          style={styles.datePickerButton}
                        >
                          <Text
                            style={[
                              styles.datePickerButtonText,
                              { color: values.date_Of_Birth ? "#111827" : "#9CA3AF" }
                            ]}
                          >
                            {values.date_Of_Birth || "Select date of birth"}
                          </Text>
                        </TouchableOpacity>
                        {touched.date_Of_Birth && errors.date_Of_Birth && (
                          <Text style={styles.errorText}>
                            {errors.date_Of_Birth}
                          </Text>
                        )}
                        {/* Date Picker */}
                        {showDatePicker && (
                          <View style={styles.datePickerContainer}>
                            <DateTimePicker
                              value={tempDateOfBirth}
                              mode="date"
                              display={Platform.OS === "ios" ? "compact" : "default"}
                              onChange={(event, selectedDate) =>
                                handleDateChange(event, selectedDate, setFieldValue)
                              }
                              maximumDate={new Date()}
                              style={{
                                height: Platform.OS === "ios" ? 50 : 200,
                                backgroundColor: "white",
                              }}
                              textColor="#111827"
                              accentColor="#10B981"
                            />
                            {Platform.OS === "ios" && (
                              <View style={styles.datePickerActions}>
                                <TouchableOpacity
                                  onPress={() => setShowDatePicker(false)}
                                  style={styles.datePickerActionButton}
                                >
                                  <Text style={styles.datePickerCancelText}>
                                    Cancel
                                  </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={() => confirmDate(setFieldValue)}
                                  style={[styles.datePickerActionButton, { marginLeft: 12 }]}
                                >
                                  <Text style={styles.datePickerDoneText}>
                                    Done
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                        )}
                      </View>

                      {/* Location */}
                      <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>Location</Text>
                        <Input
                          placeholder="Enter your location"
                          value={values.location}
                          onChangeText={handleChange("location")}
                          onBlur={handleBlur("location")}
                          type="text"
                        />
                        {touched.location && errors.location && (
                          <Text style={styles.errorText}>{errors.location}</Text>
                        )}
                      </View>

                      {/* Language */}
                      <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>Language</Text>
                        <Input
                          placeholder="Enter languages (comma separated)"
                          value={values.language}
                          onChangeText={handleChange("language")}
                          onBlur={handleBlur("language")}
                          type="text"
                        />
                        {touched.language && errors.language && (
                          <Text style={styles.errorText}>{errors.language}</Text>
                        )}
                      </View>

                      {/* About */}
                      <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>About</Text>
                        <Input
                          placeholder="Tell us about yourself"
                          value={values.about}
                          onChangeText={handleChange("about")}
                          onBlur={handleBlur("about")}
                          type="text"
                          multiline={true}
                          numberOfLines={4}
                        />
                        {touched.about && errors.about && (
                          <Text style={styles.errorText}>{errors.about}</Text>
                        )}
                      </View>

                      {/* Interest */}
                      <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>Interests</Text>
                        {/* Interest Input */}
                        <View style={styles.interestInputContainer}>
                          <View style={styles.interestInput}>
                            <Input
                              placeholder="Enter an interest"
                              value={interestInput}
                              onChangeText={setInterestInput}
                              type="text"
                            />
                          </View>
                          <TouchableOpacity
                            onPress={() => {
                              const trimmed = interestInput.trim();
                              if (trimmed && !interests.includes(trimmed)) {
                                setInterests([...interests, trimmed]);
                                setInterestInput("");
                              }
                            }}
                            style={[
                              styles.addInterestButton,
                              (!interestInput.trim() || interests.includes(interestInput.trim())) && styles.addInterestButtonDisabled
                            ]}
                            disabled={!interestInput.trim() || interests.includes(interestInput.trim())}
                          >
                            <Text style={[
                              styles.addInterestButtonText,
                              (!interestInput.trim() || interests.includes(interestInput.trim())) && styles.addInterestButtonTextDisabled
                            ]}>
                              Add
                            </Text>
                          </TouchableOpacity>
                        </View>
                        {/* Interest Badges */}
                        {interests.length > 0 && (
                          <View style={styles.interestsContainer}>
                            {interests.map((interest, index) => (
                              <View key={index} style={styles.interestBadge}>
                                <Text style={styles.interestBadgeText}>{interest}</Text>
                                <TouchableOpacity
                                  onPress={() => {
                                    setInterests(interests.filter((_, i) => i !== index));
                                  }}
                                  style={styles.removeInterestButton}
                                >
                                  <Text style={styles.removeInterestText}>-</Text>
                                </TouchableOpacity>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>

                      {/* Instagram URL */}
                      <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>Instagram URL</Text>
                        <Input
                          placeholder="Enter your Instagram profile URL"
                          value={values.instagram_Url}
                          onChangeText={handleChange("instagram_Url")}
                          onBlur={handleBlur("instagram_Url")}
                          type="text"
                          keyboardType="url"
                        />
                        {touched.instagram_Url && errors.instagram_Url && (
                          <Text style={styles.errorText}>{errors.instagram_Url}</Text>
                        )}
                      </View>

                      {/* Facebook URL */}
                      <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>Facebook URL</Text>
                        <Input
                          placeholder="Enter your Facebook profile URL"
                          value={values.facebook_Url}
                          onChangeText={handleChange("facebook_Url")}
                          onBlur={handleBlur("facebook_Url")}
                          type="text"
                          keyboardType="url"
                        />
                        {touched.facebook_Url && errors.facebook_Url && (
                          <Text style={styles.errorText}>{errors.facebook_Url}</Text>
                        )}
                      </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                      <View style={styles.buttonContainer}>
                        <Button
                          title="Cancel"
                          onPress={() => router.back()}
                          bgColor="#6B7280"
                          textColor="#FFFFFF"
                        />
                      </View>
                      <View style={[styles.buttonContainer, { marginLeft: 12 }]}>
                        <Button
                          title="Update Profile"
                          onPress={formikSubmit}
                          bgColor="#10B981"
                          textColor="#FFFFFF"
                          loading={isSubmitting || isUpdating}
                        />
                      </View>
                    </View>
                  </>
                )}
              </Formik>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default editProfile;

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  container: {
    paddingVertical: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: hp(2.5),
    fontFamily: "Poppins-Bold",
    color: "#111827",
    marginBottom: hp(0.5),
  },
  headerSubtitle: {
    fontSize: hp(1.5),
    fontFamily: "Poppins-Regular",
    color: "#6B7280",
  },
  formFields: {
    // Spacing handled by marginBottom in fieldContainer
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: hp(1.6),
    fontFamily: "Poppins-Medium",
    color: "#374151",
    marginBottom: hp(1),
  },
  errorText: {
    color: "#EF4444",
    fontSize: hp(1.3),
    marginTop: hp(0.5),
  },
  imagePickerButton: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#F9FAFB",
  },
  imagePreview: {
    width: "100%",
    height: 150,
    backgroundColor: "#E5E7EB",
  },
  userImagePreview: {
    height: 150,
    width: 150,
    borderRadius: 75,
    alignSelf: "center",
    marginVertical: 8,
  },
  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    fontSize: hp(1.4),
    fontFamily: "Poppins-Regular",
    color: "#9CA3AF",
  },
  removeImageButton: {
    marginTop: 8,
    paddingVertical: 8,
    alignItems: "center",
  },
  removeImageText: {
    fontSize: hp(1.4),
    fontFamily: "Poppins-Medium",
    color: "#EF4444",
  },
  genderRow: {
    flexDirection: "row",
  },
  genderButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  genderButtonActive: {
    backgroundColor: "#D1FAE5",
    borderColor: "#10B981",
  },
  genderButtonText: {
    fontSize: hp(1.5),
    fontFamily: "Poppins-Medium",
    textAlign: "center",
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    marginBottom: 8,
  },
  datePickerButtonText: {
    fontSize: hp(1.5),
    fontFamily: "Poppins-Regular",
    color: "#111827",
  },
  datePickerContainer: {
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  datePickerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  datePickerActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  datePickerCancelText: {
    fontSize: hp(1.5),
    fontFamily: "Poppins-Medium",
    color: "#6B7280",
  },
  datePickerDoneText: {
    fontSize: hp(1.5),
    fontFamily: "Poppins-Medium",
    color: "#10B981",
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: 32,
    marginBottom: 24,
  },
  buttonContainer: {
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: hp(1.6),
    fontFamily: "Poppins-Medium",
    color: "#6B7280",
  },
  interestInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  interestInput: {
    flex: 1,
    marginRight: 8,
  },
  addInterestButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#10B981",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 60,
  },
  addInterestButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  addInterestButtonText: {
    fontSize: hp(1.5),
    fontFamily: "Poppins-SemiBold",
    color: "#FFFFFF",
  },
  addInterestButtonTextDisabled: {
    color: "#9CA3AF",
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  interestBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  interestBadgeText: {
    fontSize: hp(1.5),
    fontFamily: "Poppins-Medium",
    color: "#374151",
    marginRight: 8,
  },
  removeInterestButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 2,
  },
  removeInterestText: {
    fontSize: hp(1.5),
    lineHeight: hp(2),
    fontFamily: "Poppins-Bold",
    color: "#FFFFFF",
    includeFontPadding: false,
  },
});

