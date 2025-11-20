import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Formik } from 'formik';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSelector } from 'react-redux';
import * as Yup from 'yup';
import Button from '../../../components/Button';
import ScreenWrapper from '../../../components/ScreenWrapper';
import SignedAvatar from '../../../components/SignedAvatar';
import { hp } from '../../../helpers/common';
import { useCreateAttendanceMutation, useGetAttendanceByAttendanceIdQuery, useUpdateAttendanceMutation } from '../../../redux/api/attendanceApi';
import { useGetStudentsByBranchAndClassQuery } from '../../../redux/api/studentApi';
import { useGetTeachersByBranchQuery } from '../../../redux/api/teacherApi';

const getValidationSchema = (role) => Yup.object().shape({
  date: Yup.string().required('Date is required'),
  users: Yup.array()
    .of(
      Yup.object().shape({
        user_Id: Yup.string().required('User ID is required'),
        role: Yup.string().oneOf([role]).required('Role is required'),
        status: Yup.string().oneOf(['present', 'absent', 'late', 'leave']).required('Status is required'),
      })
    )
    .min(1, `At least one ${role} is required`),
});

const STATUS_OPTIONS = [
  { id: 'present', label: 'Present', color: '#10B981' },
  { id: 'absent', label: 'Absent', color: '#EF4444' },
  { id: 'late', label: 'Late', color: '#F59E0B' },
  { id: 'leave', label: 'Leave', color: '#3B82F6' },
];

const formatDateForInput = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateForDisplay = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const addAttendance = () => {
  const router = useRouter();
  const {
    classId: rawClassIdFromParams,
    attendanceId,
    date: dateFromParams,
    role: roleFromParams,
  } = useLocalSearchParams();
  const { branchId, classId: classIdFromRedux, schoolId, user } = useSelector((state) => state.auth);
  const isEditMode = !!attendanceId;
  const isTeacher = user?.role === 'teacher';
  const attendanceRole = roleFromParams || 'student'; // 'teacher' or 'student'
  const isTeacherRole = attendanceRole === 'teacher';

  const classIdFromParams =
    rawClassIdFromParams && rawClassIdFromParams !== 'null' && rawClassIdFromParams !== 'undefined'
      ? Number(rawClassIdFromParams)
      : undefined;

  const classId = isTeacherRole
    ? null
    : isTeacher
    ? classIdFromRedux
    : classIdFromParams || classIdFromRedux;

  const [createAttendance, { isLoading: isCreating }] = useCreateAttendanceMutation();
  const [updateAttendance, { isLoading: isUpdating }] = useUpdateAttendanceMutation();
  
  // Fetch students or teachers based on role
  const { data: studentsData, isLoading: isLoadingStudents } = useGetStudentsByBranchAndClassQuery(
    { branchId, classId },
    { skip: !branchId || !classId || isTeacherRole }
  );

  const { data: teachersData, isLoading: isLoadingTeachers } = useGetTeachersByBranchQuery(
    branchId,
    { skip: !branchId || !isTeacherRole || (isTeacherRole && isEditMode) }
  );

  const usersData = isTeacherRole ? (teachersData || []) : (studentsData || []);
  const isLoadingUsers = isTeacherRole ? isLoadingTeachers : isLoadingStudents;

  const { data: existingAttendanceData, isLoading: isLoadingExistingAttendance } = useGetAttendanceByAttendanceIdQuery(
    { 
      attendanceId, 
      date: dateFromParams, 
      class_Id: isTeacherRole ? null : classId,
      branch_Id: isTeacherRole ? branchId : null,
      role: isTeacherRole ? attendanceRole : null,
    },
    { skip: !isEditMode || !attendanceId || !dateFromParams || (isTeacherRole ? !branchId : !classId) }
  );

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());

  const isLoading = isCreating || isUpdating || (isEditMode ? isLoadingExistingAttendance : isLoadingUsers);

  const attendanceDisplayMap = useMemo(() => {
    if (!existingAttendanceData) return new Map();
    const map = new Map();
    existingAttendanceData.forEach((record) => {
      if (record?.user_Id) {
        map.set(String(record.user_Id), record);
      }
    });
    return map;
  }, [existingAttendanceData]);

  // Initialize form with users (students or teachers) or existing attendance data
  const getInitialValues = useMemo(() => {
    const users = usersData || [];
    const today = formatDateForInput(new Date());
    
    if (isEditMode && existingAttendanceData && existingAttendanceData.length > 0) {
      return {
        date: dateFromParams || today,
        users: existingAttendanceData.map((record) => ({
          user_Id: record.user_Id,
          role: record.user_role || attendanceRole,
          status: record.status || 'present',
        })),
      };
    }
    
    return {
      date: dateFromParams || today,
      users: users.map((userItem) => ({
        user_Id: userItem.auth_User_Id || userItem.user_Id,
        role: attendanceRole,
        status: 'present', // Default to present
      })),
    };
  }, [usersData, isEditMode, existingAttendanceData, dateFromParams, attendanceRole]);

  // Initialize tempDate when dateFromParams changes
  useEffect(() => {
    if (dateFromParams) {
      setTempDate(new Date(dateFromParams));
    }
  }, [dateFromParams]);

  const handleDateChange = (event, selectedDate, setFieldValue) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setTempDate(selectedDate);
      if (Platform.OS === 'android') {
        const formattedDate = formatDateForInput(selectedDate);
        setFieldValue('date', formattedDate);
      }
    }
  };

  const confirmDate = (setFieldValue) => {
    const formattedDate = formatDateForInput(tempDate);
    setFieldValue('date', formattedDate);
    setShowDatePicker(false);
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      if (!schoolId || !branchId) {
        Alert.alert('Error', 'School and branch are required');
        return;
      }

      if (!isTeacherRole && !classId) {
        Alert.alert('Error', 'Class is required for student attendance');
        return;
      }

      if (!user?.id) {
        Alert.alert('Error', 'User ID is required');
        return;
      }

      const attendanceData = {
        date: values.date,
        school_Id: schoolId,
        branch_Id: branchId,
        ...(isTeacherRole ? {} : { class_Id: classId }),
        marked_By: user.id,
        users: values.users,
      };

      if (isEditMode) {
        // Add attendanceId for update
        attendanceData.attendanceId = attendanceId;
        await updateAttendance(attendanceData).unwrap();
        Alert.alert('Success', 'Attendance updated successfully!', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      } else {
        await createAttendance(attendanceData).unwrap();
        Alert.alert('Success', 'Attendance marked successfully!', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error?.data?.message || error?.message || `Failed to ${isEditMode ? 'update' : 'create'} attendance`
      );
    } finally {
      setSubmitting(false);
    }
  };

  if ((isEditMode && (isLoadingExistingAttendance || !existingAttendanceData)) || (!isEditMode && isLoadingUsers)) {
    return (
      <ScreenWrapper>
        <View style={styles.container}>
          <Text style={styles.loadingText}>
            {isEditMode ? 'Loading attendance data...' : `Loading ${attendanceRole}s...`}
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!isEditMode && (!usersData || usersData.length === 0)) {
    return (
      <ScreenWrapper>
        <View style={styles.container}>
          <Text style={styles.emptyText}>
            {isTeacherRole ? 'No teachers found for this branch' : 'No students found for this class'}
          </Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            bgColor="#1CACF3"
            textColor="#FFFFFF"
            size="small"
          />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                {isEditMode ? 'Edit Attendance' : 'Mark Attendance'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {isEditMode
                  ? 'Update the attendance details below'
                  : `Select date and mark attendance for ${attendanceRole}s`}
              </Text>
            </View>

            <Formik
              initialValues={getInitialValues}
              enableReinitialize={true}
              validationSchema={getValidationSchema(attendanceRole)}
              onSubmit={handleSubmit}
              key={`${attendanceRole}-${isEditMode}-${attendanceId || 'new'}-${existingAttendanceData?.length || 0}`} // Force re-initialize when data changes
            >
              {({ values, errors, touched, handleChange, handleBlur, setFieldValue, handleSubmit: formikSubmit, isSubmitting }) => (
                <>
                  {/* Form Fields */}
                  <View style={styles.formFields}>
                    {/* Date */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Date *</Text>
                      {isEditMode ? (
                        <View style={[styles.dateInputContainer, styles.dateInputDisabled]}>
                          <Text style={styles.dateInputText}>
                            {values.date ? formatDateForDisplay(values.date) : 'Select date'}
                          </Text>
                        </View>
                      ) : (
                        <>
                          <TouchableOpacity
                            style={styles.datePickerButton}
                            onPress={() => {
                              if (values.date) {
                                setTempDate(new Date(values.date));
                              } else {
                                setTempDate(new Date());
                              }
                              setShowDatePicker(true);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.datePickerButtonText,
                                { color: values.date ? '#111827' : '#9CA3AF' }
                              ]}
                            >
                              {values.date ? formatDateForDisplay(values.date) : 'Select date'}
                            </Text>
                          </TouchableOpacity>
                          {showDatePicker && (
                            <View style={styles.datePickerContainer}>
                              <DateTimePicker
                                value={tempDate}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'compact' : 'default'}
                                onChange={(event, selectedDate) => handleDateChange(event, selectedDate, setFieldValue)}
                                maximumDate={new Date()}
                                style={{
                                  height: Platform.OS === 'ios' ? 50 : 200,
                                  backgroundColor: 'white',
                                }}
                                textColor="#111827"
                                accentColor="#1CACF3"
                              />
                              {Platform.OS === 'ios' && (
                                <View style={styles.datePickerActions}>
                                  <TouchableOpacity
                                    onPress={() => setShowDatePicker(false)}
                                    style={styles.datePickerActionButton}
                                  >
                                    <Text style={styles.datePickerCancelText}>Cancel</Text>
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    onPress={() => confirmDate(setFieldValue)}
                                    style={[styles.datePickerActionButton, styles.datePickerActionButtonMargin]}
                                  >
                                    <Text style={styles.datePickerDoneText}>Done</Text>
                                  </TouchableOpacity>
                                </View>
                              )}
                            </View>
                          )}
                        </>
                      )}
                      {touched.date && errors.date && (
                        <Text style={styles.errorText}>{errors.date}</Text>
                      )}
                    </View>

                    {/* Users List (Students or Teachers) */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>{attendanceRole === 'teacher' ? 'Teachers' : 'Students'} *</Text>
                      <Text style={styles.fieldSubLabel}>
                        Select status for each {attendanceRole}
                      </Text>

                      {values.users.map((userItem, index) => {
                        const userData =
                          usersData?.find(
                            (u) => String(u.auth_User_Id || u.user_Id) === String(userItem.user_Id)
                          ) ||
                          attendanceDisplayMap.get(String(userItem.user_Id));
                        if (!userData) return null;

                        return (
                          <View key={userItem.user_Id || index} style={styles.studentCard}>
                            <View style={styles.studentHeader}>
                              <SignedAvatar
                                imageUrl={userData.user_Image || userData.user_image}
                                placeholderLabel={
                                  userData.full_Name ||
                                  userData.user_full_name ||
                                  userData.email ||
                                  userData.user_email ||
                                  (attendanceRole === 'teacher' ? 'T' : 'S')
                                }
                                size={hp(4)}
                              />
                              <View style={styles.studentInfo}>
                                <Text style={styles.studentName}>
                                  {userData.full_Name || userData.user_full_name || 'N/A'}
                                </Text>
                                <Text style={styles.studentEmail}>
                                  {userData.email || userData.user_email || 'No email'}
                                </Text>
                              </View>
                            </View>

                            {/* Status Options - Horizontal Scrollable */}
                            <ScrollView
                              horizontal
                              showsHorizontalScrollIndicator={false}
                              contentContainerStyle={styles.statusOptions}
                            >
                              {STATUS_OPTIONS.map((option) => (
                                <TouchableOpacity
                                  key={option.id}
                                  onPress={() => {
                                    const newUsers = [...values.users];
                                    newUsers[index].status = option.id;
                                    setFieldValue('users', newUsers);
                                  }}
                                  style={[
                                    styles.statusButton,
                                    values.users[index].status === option.id && {
                                      backgroundColor: option.color,
                                      borderColor: option.color,
                                    },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.statusButtonText,
                                      values.users[index].status === option.id
                                        ? styles.statusButtonTextActive
                                        : { color: option.color },
                                    ]}
                                  >
                                    {option.label}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                        );
                      })}

                      {touched.users && errors.users && (
                        <Text style={styles.errorText}>{errors.users}</Text>
                      )}
                    </View>
                  </View>

                  {/* Submit Button */}
                  <View style={styles.submitContainer}>
                    <Button
                      title={isEditMode ? 'Update Attendance' : 'Mark Attendance'}
                      onPress={formikSubmit}
                      bgColor="#1CACF3"
                      textColor="#FFFFFF"
                      disabled={isSubmitting || isLoading}
                      loading={isSubmitting || isLoading}
                    />
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

export default addAttendance;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: hp(2.5),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  formFields: {
    marginBottom: 24,
  },
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: hp(1.6),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    marginBottom: 8,
  },
  fieldSubLabel: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    marginBottom: 12,
  },
  dateInputContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  dateInputDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  dateInputText: {
    fontSize: hp(1.6),
    fontFamily: 'Poppins-Medium',
    color: '#111827',
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  datePickerButtonText: {
    fontSize: hp(1.6),
    fontFamily: 'Poppins-Medium',
  },
  datePickerContainer: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 12,
  },
  datePickerActionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  datePickerActionButtonMargin: {
    backgroundColor: '#1CACF3',
    marginLeft: 8,
  },
  datePickerCancelText: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
  },
  datePickerDoneText: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  studentInfo: {
    marginLeft: 12,
    flex: 1,
  },
  studentName: {
    fontSize: hp(1.6),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    marginBottom: 4,
  },
  studentEmail: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  statusOptions: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 8,
  },
  statusButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    minWidth: 90,
  },
  statusButtonText: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Medium',
  },
  statusButtonTextActive: {
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Regular',
    color: '#EF4444',
    marginTop: 4,
  },
  submitContainer: {
    marginTop: 8,
  },
  loadingText: {
    fontSize: hp(1.6),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 24,
  },
  emptyText: {
    fontSize: hp(1.6),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
});

