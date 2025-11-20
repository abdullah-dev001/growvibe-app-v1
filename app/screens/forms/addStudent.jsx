import { useLocalSearchParams, useRouter } from 'expo-router';
import { Formik } from 'formik';
import React from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import * as Yup from 'yup';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import ScreenWrapper from '../../../components/ScreenWrapper';
import { hp } from '../../../helpers/common';
import { useAddStudentToClassChatMutation } from '../../../redux/api/chatApi';
import { useCreateAuthMutation, useUpdateAuthMutation } from '../../../redux/api/createAuthApi';
import { useGetStudentByIdQuery } from '../../../redux/api/studentApi';

// Validation Schema Factory
const getValidationSchema = (isEditMode) => Yup.object().shape({
  email: Yup.string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: isEditMode
    ? Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .nullable()
        .transform((value) => (value === '' ? null : value))
    : Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required'),
  fee: Yup.string().required('Fee is required'),
  student_Status: Yup.boolean().required('Student status is required'),
  name: Yup.string().required('Student name is required'),
});

const addStudent = () => {
  const router = useRouter();
  const { user, schoolId, branchId, classId: classIdFromRedux } = useSelector((state) => state.auth);
  const { studentId, classId: classIdFromParams } = useLocalSearchParams();
  const classId = classIdFromParams || classIdFromRedux;
  const isEditMode = !!studentId;
  const [createAuth, { isLoading: isCreating }] = useCreateAuthMutation();
  const [updateAuth, { isLoading: isUpdating }] = useUpdateAuthMutation();
  const [addStudentToClassChat] = useAddStudentToClassChatMutation();
  const { data: studentData, isLoading: isLoadingStudent } = useGetStudentByIdQuery(studentId, {
    skip: !isEditMode,
    refetchOnMountOrArgChange: true,
  });
  const isLoading = isCreating || isUpdating;

//   const handleSubmit = async (values, { setSubmitting }) => {
//     try {
//       const studentData = {
//         email: values.email,
//         password: values.password,
//         fee: values.fee,
//         student_Status: values.student_Status,
//         role: 'student',
//       };

//       // TODO: Replace with actual API call
      
//       Alert.alert(
//         'Success',
//         'Student added successfully!',
//         [
//           {
//             text: 'OK',
//             onPress: () => router.back()
//           }
//         ]
//       );
//     } catch (error) {
//       Alert.alert('Error', error.message || 'Failed to add student');
//     } finally {
//       setSubmitting(false);
//     }
//   };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      if (isEditMode) {
        const authId = studentData?.auth_User_Id || studentId;
        if (!authId) {
          Alert.alert("Error", "Student auth ID not available");
          return;
        }
        await updateAuth({
          user_Id: authId,
          email: values.email,
          password: values.password || undefined,
          status: values.student_Status,
          role: "student",
          school_Id: schoolId,
          branch_Id: branchId,
          class_Id: studentData?.class_Id || classId,
          fullName: values.name,
          fee: values.fee,
        }).unwrap();

        Alert.alert("Success", "Student updated successfully!", [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]);
      } else {
        const result = await createAuth({
          email: values.email,
          password: values.password,
          status: values.student_Status,
          fee: values.fee,
          fullName: values.name,
          role: "student",
          school_Id: schoolId,
          branch_Id: branchId,
          class_Id: classId,
        }).unwrap();
        
        // Get student ID from response (could be in different locations)
        const studentAuthId = result?.data?.user?.id || result?.user?.id || result?.id;
        
        // Add student to class chat group if classId and studentId exist
        if (classId && studentAuthId) {
          try {
            await addStudentToClassChat({
              classId: classId,
              studentId: studentAuthId,
            }).unwrap();
          } catch (chatError) {
            // Error adding student to chat group - don't fail student creation
          }
        }
        
        Alert.alert("Success", "Student added successfully!", [
          {
            text: "OK",
            onPress: () => {
              resetForm();
              router.back();
            },
          },
        ]);
      }
    } catch (error) {
      Alert.alert("Error", error?.message || error?.data?.message || "Failed to save student");
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading state while fetching student data
  if (isEditMode && isLoadingStudent) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading student data...</Text>
        </View>
      </ScreenWrapper>
    );
  }
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
                {isEditMode ? "Edit Student" : "Add New Student"}
              </Text>
              <Text style={styles.headerSubtitle}>
                {isEditMode
                  ? "Update the student details"
                  : "Fill in the details to add a new student"}
              </Text>
            </View>

            <Formik
              key={studentData?.auth_User_Id || "new"}
              initialValues={{
                email: studentData?.email || '',
                password: '',
                name: studentData?.full_Name || '',
                fee: studentData?.fee || '',
                student_Status: studentData?.profile_Status !== undefined ? studentData.profile_Status : true,
              }}
              validationSchema={getValidationSchema(isEditMode)}
              onSubmit={handleSubmit}
              enableReinitialize
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
                    {/* Email */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>
                        Email *
                      </Text>
                      <Input
                        placeholder="Enter student email"
                        value={values.email}
                        onChangeText={handleChange('email')}
                        onBlur={handleBlur('email')}
                        type="email"
                      />
                      {touched.email && errors.email && (
                        <Text style={styles.errorText}>
                          {errors.email}
                        </Text>
                      )}
                    </View>

                    {/* Password */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>
                        Password {isEditMode ? "(leave blank to keep current)" : "*"}
                      </Text>
                      <Input
                        placeholder={isEditMode ? "Enter new password (optional)" : "Enter password"}
                        value={values.password}
                        onChangeText={handleChange('password')}
                        onBlur={handleBlur('password')}
                        type="password"
                      />
                      {touched.password && errors.password && (
                        <Text style={styles.errorText}>
                          {errors.password}
                        </Text>
                      )}
                    </View>

                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>
                        Student Name *
                      </Text>
                      <Input
                        placeholder="Enter student name"
                        value={values.name}
                        onChangeText={handleChange('name')}
                        onBlur={handleBlur('name')}
                        type="text"
                      />
                      {touched.name && errors.name && (
                        <Text style={styles.errorText}>
                          {errors.name}
                        </Text>
                      )}
                    </View>

                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>
                        Fee (Monthly) *
                      </Text>
                      <Input
                        placeholder="Enter fee (Monthly)"
                        value={values.fee}
                        onChangeText={handleChange('fee')}
                        onBlur={handleBlur('fee')}
                        type="text"
                      />
                      {touched.fee && errors.fee && (
                        <Text style={styles.errorText}>
                          {errors.fee}
                        </Text>
                      )}
                    </View>

                    {/* Student Status */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>
                        Student Status
                      </Text>
                      <View style={styles.statusRow}>
                        <TouchableOpacity
                          onPress={() => setFieldValue('student_Status', true)}
                          style={[
                            styles.statusButton,
                            { flex: 1 },
                            values.student_Status ? styles.statusButtonActive : styles.statusButtonInactive
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusButtonText,
                              { color: values.student_Status ? '#10B981' : '#6B7280' }
                            ]}
                          >
                            Active
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setFieldValue('student_Status', false)}
                          style={[
                            styles.statusButton,
                            { flex: 1, marginLeft: 12 },
                            !values.student_Status ? styles.statusButtonInactiveRed : styles.statusButtonInactive
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusButtonText,
                              { color: !values.student_Status ? '#EF4444' : '#6B7280' }
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
                        title={isEditMode ? "Update Student" : "Add Student"}
                        onPress={formikSubmit}
                        bgColor="#10B981"
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

export default addStudent;

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
  actionButtons: {
    flexDirection: 'row',
    marginTop: 32,
    marginBottom: 24,
  },
  buttonContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: hp(1.6),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
  },
});