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
import { useCreateBranchMutation } from '../../../redux/api/branchApi';

// Validation Schema
const validationSchema = Yup.object().shape({
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
  branch_Subscription_Fee: Yup.string()
    .required('Subscription fee is required')
    .matches(
      /^\$?[0-9]+(\.[0-9]{2})?$/,
      'Please enter a valid amount (e.g., $500 or 500.00)'
    ),
});

const addBranch = () => {
  const router = useRouter();
  const { schoolId, schoolName } = useLocalSearchParams();
  const { user } = useSelector((state) => state.auth);
  const [createBranch, { isLoading }] = useCreateBranchMutation();

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const branchData = {
        branch_Name: values.branch_Name,
        branch_Address: values.branch_Address,
        branch_Contact: values.branch_Contact,
        branch_Status: values.branch_Status,
        branch_Subscription_Fee: values.branch_Subscription_Fee,
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
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to add branch');
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
              Add New Branch
            </Text>
            <Text style={styles.headerSubtitle}>
              Add a new branch for {schoolName}
            </Text>
          </View>

          <Formik
            initialValues={{
              branch_Name: '',
              branch_Address: '',
              branch_Contact: '',
              branch_Status: true,
              branch_Subscription_Fee: '',
            }}
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

                  {/* Subscription Fee */}
                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>
                      Subscription Fee *
                    </Text>
                    <Input
                      placeholder="Enter subscription fee (e.g., $500 or 500.00)"
                      value={values.branch_Subscription_Fee}
                      onChangeText={handleChange('branch_Subscription_Fee')}
                      onBlur={handleBlur('branch_Subscription_Fee')}
                      type="text"
                    />
                    {touched.branch_Subscription_Fee && errors.branch_Subscription_Fee && (
                      <Text style={styles.errorText}>
                        {errors.branch_Subscription_Fee}
                      </Text>
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
                      className="flex-1"
                    />
                  </View>
                  <View style={[styles.buttonContainer, { marginLeft: 12 }]}>
                    <Button
                      title="Add Branch"
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
    fontFamily: 'Poppins-Bold',
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
});
