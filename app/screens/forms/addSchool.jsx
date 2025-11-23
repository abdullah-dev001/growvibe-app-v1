import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Formik } from 'formik';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import * as Yup from 'yup';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import ScreenWrapper from '../../../components/ScreenWrapper';
import { hp } from '../../../helpers/common';
import { useGetOwnersWithoutSchoolIdQuery } from '../../../redux/api/ownerApi';
import { useCreateSchoolMutation, useGetSchoolByIdQuery, useUpdateSchoolMutation } from '../../../redux/api/schoolApi';
import { supabase } from '../../../supabaseClient';

// Validation Schema Factory
const getValidationSchema = (isEditMode) => Yup.object().shape({
  school_Name: Yup.string()
    .required('School name is required')
    .min(2, 'School name must be at least 2 characters')
    .max(100, 'School name must be less than 100 characters'),
  school_Address: Yup.string()
    .required('School address is required')
    .min(10, 'Address must be at least 10 characters')
    .max(200, 'Address must be less than 200 characters'),
  school_Contact: Yup.string()
    .required('School contact is required')
    .matches(
      /^[\+]?[1-9][\d]{0,15}$|^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Please enter a valid phone number or email'
    ),
  school_Status: Yup.boolean().required('School status is required'),
  school_Owner: isEditMode 
    ? Yup.string() 
    : Yup.string().required('School owner is required'),
});

const addSchool = () => {
  const router = useRouter();
  const { schoolId } = useLocalSearchParams();
  const isEditMode = !!schoolId;
  const { user } = useSelector((state) => state.auth);
  const [createSchool, { isLoading: isCreating }] = useCreateSchoolMutation();
  const [updateSchool, { isLoading: isUpdating }] = useUpdateSchoolMutation();
  const { data: owners } = useGetOwnersWithoutSchoolIdQuery(undefined, { skip: isEditMode });
  const { data: schoolData, isLoading: isLoadingSchool } = useGetSchoolByIdQuery(schoolId, { 
    skip: !isEditMode,
    refetchOnMountOrArgChange: true,
  });
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [schoolLogo, setSchoolLogo] = useState(null);
  const [schoolLogoSignedUrl, setSchoolLogoSignedUrl] = useState(null);
  const [oldLogoUrl, setOldLogoUrl] = useState(null);
  const isLoading = isCreating || isUpdating;

  // Load existing logo in edit mode
  useEffect(() => {
    if (isEditMode && schoolData?.school_Logo) {
      setOldLogoUrl(schoolData.school_Logo);
      // Generate signed URL for existing logo
      const generateSignedUrl = async () => {
        // school_Logo can be either a path (school-logos/{id}.jpg) or a full URL
        let logoPath = schoolData.school_Logo;
        
        // If it's a full URL, extract the path
        if (logoPath && logoPath.includes('http')) {
          try {
            const urlObj = new URL(logoPath);
            const pathParts = urlObj.pathname.split('/');
            const bucketIndex = pathParts.findIndex(part => part === 'school-logos');
            if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
              logoPath = pathParts.slice(bucketIndex + 1).join('/');
            } else {
              logoPath = null;
            }
          } catch (e) {
            logoPath = null;
          }
        }
        
        // Remove 'school-logos/' prefix if present (since we specify bucket in from())
        if (logoPath && logoPath.startsWith('school-logos/')) {
          logoPath = logoPath.replace('school-logos/', '');
        }

        if (logoPath) {
          try {
            const { data, error } = await supabase.storage
              .from('school-logos')
              .createSignedUrl(logoPath, 3600);
            if (!error && data?.signedUrl) {
              setSchoolLogoSignedUrl(data.signedUrl);
            }
          } catch (e) {
            console.log('Error generating logo signed URL:', e);
          }
        }
      };

      generateSignedUrl();
    }
  }, [schoolData?.school_Logo, isEditMode]);

  const handleOwnerSelect = (owner, setFieldValue) => {
    setSelectedOwner(owner);
    setFieldValue('school_Owner', owner.auth_user_id);
    setShowOwnerDropdown(false);
  };

  const handlePickLogo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to select a logo');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Resize and compress the image
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 512, height: 512 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );

        setSchoolLogo(manipulatedImage.uri);
        setSchoolLogoSignedUrl(manipulatedImage.uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image: ' + error.message);
    }
  };

  const handleRemoveLogo = () => {
    setSchoolLogo(null);
    setSchoolLogoSignedUrl(null);
  };

  const uploadSchoolLogo = async (schoolId) => {
    if (!schoolLogo) return null;

    try {
      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(schoolLogo, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to ArrayBuffer
      const arrayBuffer = decode(base64);

      // Get file extension
      const fileExtension = schoolLogo.split('.').pop() || 'jpg';
      const fileName = `${schoolId}.${fileExtension}`;

      // Upload to school-logos bucket
      const { data, error } = await supabase.storage
        .from('school-logos')
        .upload(fileName, arrayBuffer, {
          contentType: `image/${fileExtension === 'png' ? 'png' : 'jpeg'}`,
          upsert: true, // Replace if exists
        });

      if (error) throw error;

      // For private bucket, we store the path and generate signed URLs when needed
      // Return the storage path format: school-logos/{fileName}
      return `school-logos/${fileName}`;
    } catch (error) {
      console.log('Error uploading logo:', error);
      throw new Error('Failed to upload logo: ' + error.message);
    }
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      if (isEditMode) {
        const updateData = {
          id: schoolId,
          school_Name: values.school_Name,
          school_Address: values.school_Address,
          school_Contact: values.school_Contact,
          school_Status: values.school_Status,
        };

        // Upload logo if selected
        if (schoolLogo) {
          const logoPath = await uploadSchoolLogo(schoolId);
          if (logoPath) {
            // Store the path for signed URL generation
            updateData.school_Logo = logoPath;
          }
        } else if (schoolLogo === null && oldLogoUrl) {
          // Logo was removed, set to null
          updateData.school_Logo = null;
        }

        await updateSchool(updateData).unwrap();
        
        Alert.alert(
          'Success',
          'School updated successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        );
      } else {
        const schoolData = {
          school_Name: values.school_Name,
          school_Address: values.school_Address,
          school_Contact: values.school_Contact,
          school_Status: values.school_Status,
          owner_Id: values.school_Owner,
        };

        const result = await createSchool(schoolData).unwrap();
        const newSchoolId = result?.[0]?.id;

        // Upload logo if selected
        if (schoolLogo && newSchoolId) {
          const logoPath = await uploadSchoolLogo(newSchoolId);
          if (logoPath) {
            // Update school with logo path (for signed URL generation)
            await supabase
              .from('school')
              .update({ school_Logo: logoPath })
              .eq('id', newSchoolId);
          }
        }
        
        Alert.alert(
          'Success',
          'School added successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', error.message || `Failed to ${isEditMode ? 'update' : 'add'} school`);
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
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              {isEditMode ? 'Edit School' : 'Add New School'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isEditMode ? 'Update the school details' : 'Fill in the details to add a new school'}
            </Text>
          </View>

          {isLoadingSchool ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading school data...</Text>
            </View>
          ) : (
          <Formik
            initialValues={{
              school_Name: schoolData?.school_Name || '',
              school_Address: schoolData?.school_Address || '',
              school_Contact: schoolData?.school_Contact || '',
              school_Status: schoolData?.school_Status ?? true,
              school_Owner: schoolData?.owner_Id || '',
            }}
            enableReinitialize
            validationSchema={getValidationSchema(isEditMode)}
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
              isSubmitting 
            }) => (
              <>
                {/* Form Fields */}
                <View style={styles.formFields}>
                  {/* School Name */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>
                      School Name *
                    </Text>
                    <Input
                      placeholder="Enter school name"
                      value={values.school_Name}
                      onChangeText={handleChange('school_Name')}
                      onBlur={handleBlur('school_Name')}
                      type="text"
                    />
                    {touched.school_Name && errors.school_Name && (
                      <Text style={styles.errorText}>
                        {errors.school_Name}
                      </Text>
                    )}
                  </View>

                  {/* School Address */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>
                      School Address *
                    </Text>
                    <Input
                      placeholder="Enter school address"
                      value={values.school_Address}
                      onChangeText={handleChange('school_Address')}
                      onBlur={handleBlur('school_Address')}
                      type="text"
                      multiline={true}
                      numberOfLines={3}
                    />
                    {touched.school_Address && errors.school_Address && (
                      <Text style={styles.errorText}>
                        {errors.school_Address}
                      </Text>
                    )}
                  </View>

                  {/* School Contact */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>
                      School Contact *
                    </Text>
                    <Input
                      placeholder="Enter contact number or email"
                      value={values.school_Contact}
                      onChangeText={handleChange('school_Contact')}
                      onBlur={handleBlur('school_Contact')}
                      type="text"
                    />
                    {touched.school_Contact && errors.school_Contact && (
                      <Text style={styles.errorText}>
                        {errors.school_Contact}
                      </Text>
                    )}
                  </View>

                  {/* School Logo */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>
                      School Logo
                    </Text>
                    <View style={styles.logoContainer}>
                      {schoolLogoSignedUrl ? (
                        <View style={styles.logoPreviewContainer}>
                          <Image
                            source={{ uri: schoolLogoSignedUrl }}
                            style={styles.logoPreview}
                            contentFit="contain"
                          />
                          <TouchableOpacity
                            onPress={handleRemoveLogo}
                            style={styles.removeLogoButton}
                          >
                            <Text style={styles.removeLogoText}>Remove</Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={handlePickLogo}
                          style={styles.logoPickerButton}
                        >
                          <Text style={styles.logoPickerText}>Select Logo</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  {/* School Status */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>
                      School Status
                    </Text>
                    <View style={styles.statusRow}>
                      <TouchableOpacity
                        onPress={() => setFieldValue('school_Status', true)}
                        style={[
                          styles.statusButton,
                          { flex: 1 },
                          values.school_Status ? styles.statusButtonActive : styles.statusButtonInactive
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusButtonText,
                            { color: values.school_Status ? '#10B981' : '#6B7280' }
                          ]}
                        >
                          Active
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setFieldValue('school_Status', false)}
                        style={[
                          styles.statusButton,
                          { flex: 1, marginLeft: 12 },
                          !values.school_Status ? styles.statusButtonInactiveRed : styles.statusButtonInactive
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusButtonText,
                            { color: !values.school_Status ? '#EF4444' : '#6B7280' }
                          ]}
                        >
                          Inactive
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* School Owner - Only show in create mode */}
                  {!isEditMode && (
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>
                        School Owner *
                      </Text>
                      <TouchableOpacity
                        onPress={() => setShowOwnerDropdown(!showOwnerDropdown)}
                        style={styles.ownerSelector}
                      >
                        <Text
                          style={[
                            styles.ownerSelectorText,
                            { color: selectedOwner ? '#111827' : '#9CA3AF' }
                          ]}
                        >
                          {selectedOwner ? `${selectedOwner.full_Name} (${selectedOwner.email})` : 'Select school owner'}
                        </Text>
                      </TouchableOpacity>

                      {/* Owner Dropdown */}
                      {showOwnerDropdown && (
                        <View style={styles.ownerDropdown}>
                          {owners?.map((owner) => (
                            <TouchableOpacity
                              key={owner?.id}
                              onPress={() => handleOwnerSelect(owner, setFieldValue)}
                              style={styles.ownerDropdownItem}
                            >
                              <Text
                                style={{
                                  fontSize: hp(1.5),
                                  fontFamily: 'Poppins-Medium',
                                  color: '#111827',
                                }}
                              >
                                {owner?.full_Name}
                              </Text>
                              <Text
                                style={{
                                  fontSize: hp(1.3),
                                  fontFamily: 'Poppins-Regular',
                                  color: '#6B7280',
                                }}
                              >
                                {owner.email}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                      {touched.school_Owner && errors.school_Owner && (
                        <Text style={styles.errorText}>
                          {errors.school_Owner}
                        </Text>
                      )}
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <View style={styles.buttonContainer}>
                    <Button
                      title="Cancel"
                      onPress={() => router.back()}
                      bgColor="#6B7280"
                      textColor="#FFFFFF"
                      className="flex-1"
                    />
                  </View>
                  <View style={[styles.buttonContainer, { marginLeft: 12 }]}>
                    <Button
                      title={isEditMode ? "Update School" : "Add School"}
                      onPress={formikSubmit}
                      bgColor="#1CACF3"
                      textColor="#FFFFFF"
                      className="flex-1"
                      loading={isSubmitting || isLoading}
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

export default addSchool;

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  container: {
    paddingVertical: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: hp(2.5),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    marginBottom: hp(0.5),
  },
  headerSubtitle: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  formFields: {
    // gap handled by marginBottom in fieldContainer
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: hp(1.6),
    fontFamily: 'Poppins-Medium',
    color: '#374151',
    marginBottom: hp(1),
  },
  errorText: {
    color: '#EF4444',
    fontSize: hp(1.3),
    marginTop: hp(0.5),
  },
  statusRow: {
    flexDirection: 'row',
  },
  statusButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusButtonActive: {
    backgroundColor: '#D1FAE5',
    borderColor: '#A7F3D0',
  },
  statusButtonInactive: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  statusButtonInactiveRed: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  statusButtonText: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
  },
  ownerSelector: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  ownerSelectorText: {
    fontSize: hp(1.6),
    fontFamily: 'Poppins-Regular',
  },
  ownerDropdown: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ownerDropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 32,
    marginBottom: 24,
  },
  buttonContainer: {
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: hp(1.6),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  logoContainer: {
    marginTop: hp(0.5),
  },
  logoPickerButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPickerText: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
  },
  logoPreviewContainer: {
    alignItems: 'center',
  },
  logoPreview: {
    width: hp(12),
    height: hp(12),
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  removeLogoButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
  },
  removeLogoText: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Medium',
    color: '#EF4444',
  },
});