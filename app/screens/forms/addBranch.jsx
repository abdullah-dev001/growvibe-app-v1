import { useLocalSearchParams, useRouter } from 'expo-router';
import { Formik } from 'formik';
import React from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import * as Yup from 'yup';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import ScreenWrapper from '../../../components/ScreenWrapper';
import { hp } from '../../../helpers/common';
import { useCreateBranchMutation, useGetBranchByIdQuery, useUpdateBranchMutation } from '../../../redux/api/branchApi';

// Validation Schema Factory
const getValidationSchema = () => Yup.object().shape({
  branch_Name: Yup.string()
    .required('Branch name is required')
    .min(2, 'Branch name must be at least 2 characters')
    .max(100, 'Branch name must be less than 100 characters'),
  branch_Address: Yup.string()
    .required('Branch address is required')
    .min(10, 'Address must be at least 10 characters')
    .max(200, 'Address must be less than 200 characters'),
  branch_Contact: Yup.string()
    .required('Branch contact is required')
    .matches(
      /^[\+]?[1-9][\d]{0,15}$|^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Please enter a valid phone number or email'
    ),
  branch_Status: Yup.boolean().required('Branch status is required'),
});

const addBranch = () => {
  const router = useRouter();
  const { branchId, schoolId, schoolName } = useLocalSearchParams();
  const isEditMode = !!branchId;
  const { user } = useSelector((state) => state.auth);
  const [createBranch, { isLoading: isCreating }] = useCreateBranchMutation();
  const [updateBranch, { isLoading: isUpdating }] = useUpdateBranchMutation();
  const { data: branchData, isLoading: isLoadingBranch } = useGetBranchByIdQuery(branchId, { 
    skip: !isEditMode,
    refetchOnMountOrArgChange: true,
  });
  const isLoading = isCreating || isUpdating;

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      if (isEditMode) {
        const updateData = {
          id: branchId,
          branch_Name: values.branch_Name,
          branch_Address: values.branch_Address,
          branch_Contact: values.branch_Contact,
          branch_Status: values.branch_Status,
        };

        await updateBranch(updateData).unwrap();
        
        Alert.alert(
          'Success',
          'Branch updated successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        );
      } else {
        const branchData = {
          branch_Name: values.branch_Name,
          branch_Address: values.branch_Address,
          branch_Contact: values.branch_Contact,
          branch_Status: values.branch_Status,
          school_Id: schoolId,
        };

        await createBranch(branchData).unwrap();
        
        Alert.alert(
          'Success',
          'Branch added successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.back()
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', error.message || `Failed to ${isEditMode ? 'update' : 'add'} branch`);
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
              {isEditMode ? 'Edit Branch' : 'Add New Branch'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isEditMode ? 'Update the branch details' : `Add a new branch for ${schoolName}`}
            </Text>
          </View>

          {isLoadingBranch ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading branch data...</Text>
            </View>
          ) : (
          <Formik
            initialValues={{
              branch_Name: branchData?.branch_Name || '',
              branch_Address: branchData?.branch_Address || '',
              branch_Contact: branchData?.branch_Contact || '',
              branch_Status: branchData?.branch_Status ?? true,
            }}
            enableReinitialize
            validationSchema={getValidationSchema()}
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
                  {/* Branch Name */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>
                      Branch Name *
                    </Text>
                    <Input
                      placeholder="Enter branch name"
                      value={values.branch_Name}
                      onChangeText={handleChange('branch_Name')}
                      onBlur={handleBlur('branch_Name')}
                      type="text"
                    />
                    {touched.branch_Name && errors.branch_Name && (
                      <Text style={styles.errorText}>
                        {errors.branch_Name}
                      </Text>
                    )}
                  </View>

                  {/* Branch Address */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>
                      Branch Address *
                    </Text>
                    <Input
                      placeholder="Enter branch address"
                      value={values.branch_Address}
                      onChangeText={handleChange('branch_Address')}
                      onBlur={handleBlur('branch_Address')}
                      type="text"
                      multiline={true}
                      numberOfLines={3}
                    />
                    {touched.branch_Address && errors.branch_Address && (
                      <Text style={styles.errorText}>
                        {errors.branch_Address}
                      </Text>
                    )}
                  </View>

                  {/* Branch Contact */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>
                      Branch Contact *
                    </Text>
                    <Input
                      placeholder="Enter contact number or email"
                      value={values.branch_Contact}
                      onChangeText={handleChange('branch_Contact')}
                      onBlur={handleBlur('branch_Contact')}
                      type="text"
                    />
                    {touched.branch_Contact && errors.branch_Contact && (
                      <Text style={styles.errorText}>
                        {errors.branch_Contact}
                      </Text>
                    )}
                  </View>

                  {/* Branch Status */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>
                      Branch Status
                    </Text>
                    <View style={styles.statusRow}>
                      <TouchableOpacity
                        onPress={() => setFieldValue('branch_Status', true)}
                        style={[
                          styles.statusButton,
                          { flex: 1 },
                          values.branch_Status ? styles.statusButtonActive : styles.statusButtonInactive
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusButtonText,
                            { color: values.branch_Status ? '#10B981' : '#6B7280' }
                          ]}
                        >
                          Active
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setFieldValue('branch_Status', false)}
                        style={[
                          styles.statusButton,
                          { flex: 1, marginLeft: 12 },
                          !values.branch_Status ? styles.statusButtonInactiveRed : styles.statusButtonInactive
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusButtonText,
                            { color: !values.branch_Status ? '#EF4444' : '#6B7280' }
                          ]}
                        >
                          Inactive
                        </Text>
                      </TouchableOpacity>
                    </View>
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
                      className="flex-1"
                    />
                  </View>
                  <View style={[styles.buttonContainer, { marginLeft: 12 }]}>
                    <Button
                      title={isEditMode ? "Update Branch" : "Add Branch"}
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

export default addBranch;

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
    // Spacing handled by marginBottom in fieldContainer
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
});
