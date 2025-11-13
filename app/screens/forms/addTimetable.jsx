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
import Trash from '../../../assets/icons/Trash';
import Button from '../../../components/Button';
import Input from '../../../components/Input';
import ScreenWrapper from '../../../components/ScreenWrapper';
import { hp } from '../../../helpers/common';
import { useGetTeachersByBranchQuery } from '../../../redux/api/teacherApi';
import { useCreateTimetableMutation, useGetTimetablesByClassQuery } from '../../../redux/api/timetableApi';

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Validation Schema
const validationSchema = Yup.object().shape({
  day: Yup.string().required('Day is required'),
  periods: Yup.array()
    .of(
      Yup.object().shape({
        subject_Name: Yup.string().required('Subject name is required'),
        teacher_Id: Yup.string().required('Teacher is required'),
        start_Time: Yup.string()
          .required('Start time is required')
          .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, 'Time must be in HH:MM:SS format'),
        end_Time: Yup.string()
          .required('End time is required')
          .matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/, 'Time must be in HH:MM:SS format')
          .test('is-after-start', 'End time must be after start time', function (value) {
            const { start_Time } = this.parent;
            if (!value || !start_Time) return true;
            return value > start_Time;
          }),
      })
    )
    .min(1, 'At least one period is required'),
});

const addTimetable = () => {
  const router = useRouter();
  const { classId, className, schoolId, branchId, weekNumber } = useLocalSearchParams();
  const { branchId: branchIdFromRedux, schoolId: schoolIdFromRedux } = useSelector((state) => state.auth);
  const [createTimetable, { isLoading: isCreating }] = useCreateTimetableMutation();
  const [showStartTimePicker, setShowStartTimePicker] = useState(null); // null or period index
  const [showEndTimePicker, setShowEndTimePicker] = useState(null); // null or period index
  const [tempStartTime, setTempStartTime] = useState(new Date());
  const [tempEndTime, setTempEndTime] = useState(new Date());

  const finalBranchId = branchId || branchIdFromRedux;
  const finalSchoolId = schoolId || schoolIdFromRedux;

  const { data: teachers, isLoading: isLoadingTeachers } = useGetTeachersByBranchQuery(finalBranchId, {
    skip: !finalBranchId,
  });

  // Fetch existing timetables for this class and week to filter out days that already have timetables
  const { data: existingTimetables } = useGetTimetablesByClassQuery(classId, {
    skip: !classId,
  });

  // Get days that already have timetables for this week
  const existingDays = useMemo(() => {
    if (!existingTimetables || !weekNumber) return [];
    const weekNum = Number(weekNumber);
    return existingTimetables
      .filter((tt) => tt.week_number === weekNum)
      .map((tt) => tt.day)
      .filter((day, index, self) => self.indexOf(day) === index); // unique days
  }, [existingTimetables, weekNumber]);

  // Filter available days
  const availableDays = useMemo(() => {
    return daysOfWeek.filter((day) => !existingDays.includes(day));
  }, [existingDays]);


  const formatTimeForInput = (date) => {
    if (!date) return '';
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}:00`;
  };

  const handleStartTimeChange = (event, selectedTime, setFieldValue, periodIndex, values) => {
    if (Platform.OS === 'android') {
      setShowStartTimePicker(null);
    }
    if (selectedTime) {
      setTempStartTime(selectedTime);
      if (Platform.OS === 'android') {
        const formattedTime = formatTimeForInput(selectedTime);
        const newPeriods = [...values.periods];
        newPeriods[periodIndex].start_Time = formattedTime;
        setFieldValue('periods', newPeriods);
      }
    }
  };

  const handleEndTimeChange = (event, selectedTime, setFieldValue, periodIndex, values) => {
    if (Platform.OS === 'android') {
      setShowEndTimePicker(null);
    }
    if (selectedTime) {
      setTempEndTime(selectedTime);
      if (Platform.OS === 'android') {
        const formattedTime = formatTimeForInput(selectedTime);
        const newPeriods = [...values.periods];
        newPeriods[periodIndex].end_Time = formattedTime;
        setFieldValue('periods', newPeriods);
      }
    }
  };

  const confirmStartTime = (setFieldValue, periodIndex, values) => {
    const formattedTime = formatTimeForInput(tempStartTime);
    const newPeriods = [...values.periods];
    newPeriods[periodIndex].start_Time = formattedTime;
    setFieldValue('periods', newPeriods);
    setShowStartTimePicker(null);
  };

  const confirmEndTime = (setFieldValue, periodIndex, values) => {
    const formattedTime = formatTimeForInput(tempEndTime);
    const newPeriods = [...values.periods];
    newPeriods[periodIndex].end_Time = formattedTime;
    setFieldValue('periods', newPeriods);
    setShowEndTimePicker(null);
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      const timetableData = {
        school_Id: Number(finalSchoolId),
        branch_Id: Number(finalBranchId),
        class_Id: Number(classId),
        week_number: Number(weekNumber),
        day: values.day,
        periods: values.periods.map((period) => ({
          subject_Name: period.subject_Name,
          teacher_Id: period.teacher_Id,
          start_Time: period.start_Time,
          end_Time: period.end_Time,
        })),
      };

      await createTimetable(timetableData).unwrap();

      Alert.alert('Success', 'Timetable added successfully!', [
        {
          text: 'OK',
          onPress: () => {
            resetForm();
            router.back();
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Error', error?.data?.message || error?.message || 'Failed to add timetable');
    } finally {
      setSubmitting(false);
    }
  };

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
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Add New Timetable</Text>
              <Text style={styles.headerSubtitle}>
                Week {weekNumber} - {className || 'Class Timetable'}
              </Text>
            </View>

            <Formik
              initialValues={{
                day: '',
                periods: [{ subject_Name: '', teacher_Id: '', start_Time: '', end_Time: '' }],
              }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({
                handleChange,
                handleBlur,
                handleSubmit: formikSubmit,
                values,
                errors,
                touched,
                setFieldValue,
                isSubmitting,
              }) => {
                // Auto-select first available day if none selected
                useEffect(() => {
                  if (availableDays.length === 1 && values.day === '') {
                    setFieldValue('day', availableDays[0], false);
                  } else if (availableDays.length === 0 && values.day !== '') {
                    setFieldValue('day', '', false);
                  }
                }, [availableDays, values.day, setFieldValue]);

                const addPeriod = () => {
                  setFieldValue('periods', [
                    ...values.periods,
                    { subject_Name: '', teacher_Id: '', start_Time: '', end_Time: '' },
                  ]);
                };

                const removePeriod = (index) => {
                  if (values.periods.length > 1) {
                    const newPeriods = values.periods.filter((_, i) => i !== index);
                    setFieldValue('periods', newPeriods);
                  } else {
                    Alert.alert('Info', 'At least one period is required');
                  }
                };

                return (
                  <>
                    {/* Form Fields */}
                    <View style={styles.formFields}>
                      {/* Day Selection */}
                      <View style={styles.fieldContainer}>
                        <Text style={styles.fieldLabel}>Day *</Text>
                        <View style={styles.daySelector}>
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.dayScrollView}
                          >
                            <View style={styles.dayRow}>
                              {availableDays.length > 0 ? (
                                availableDays.map((day) => {
                                  const isSelected = values.day === day;
                                  return (
                                    <TouchableOpacity
                                      key={day}
                                      onPress={() => setFieldValue('day', day)}
                                      style={[
                                        styles.dayButton,
                                        isSelected ? styles.dayButtonActive : styles.dayButtonInactive,
                                      ]}
                                      activeOpacity={0.7}
                                    >
                                      <Text
                                        style={[
                                          styles.dayButtonText,
                                          { color: isSelected ? '#F59E0B' : '#6B7280' },
                                        ]}
                                      >
                                        {day}
                                      </Text>
                                    </TouchableOpacity>
                                  );
                                })
                              ) : (
                                <Text style={styles.noDaysText}>
                                  All days already have timetables for this week
                                </Text>
                              )}
                            </View>
                          </ScrollView>
                        </View>
                        {touched.day && errors.day && (
                          <Text style={styles.errorText}>{errors.day}</Text>
                        )}
                      </View>

                      {/* Periods */}
                      <View style={styles.fieldContainer}>
                        <View style={styles.periodsHeader}>
                          <Text style={styles.fieldLabel}>Periods *</Text>
                          <TouchableOpacity onPress={addPeriod} style={styles.addPeriodButton} activeOpacity={0.7}>
                            <Text style={styles.addPeriodButtonText}>+ Add Period</Text>
                          </TouchableOpacity>
                        </View>

                      {values.periods.map((period, index) => (
                        <View key={index} style={styles.periodCard}>
                          <View style={styles.periodHeader}>
                            <Text style={styles.periodNumber}>Period {index + 1}</Text>
                            {values.periods.length > 1 && (
                              <TouchableOpacity
                                onPress={() => removePeriod(index)}
                                style={styles.removePeriodButton}
                                activeOpacity={0.7}
                              >
                                <Trash size={hp(1.5)} color="#EF4444" strokeWidth={2} />
                              </TouchableOpacity>
                            )}
                          </View>

                          {/* Subject Name */}
                          <Input
                            label="Subject Name *"
                            placeholder="e.g., Math, Science"
                            value={period.subject_Name}
                            onChangeText={(text) => {
                              const newPeriods = [...values.periods];
                              newPeriods[index].subject_Name = text;
                              setFieldValue('periods', newPeriods);
                            }}
                            onBlur={handleBlur(`periods[${index}].subject_Name`)}
                            error={
                              touched.periods?.[index]?.subject_Name &&
                              errors.periods?.[index]?.subject_Name
                            }
                          />

                          {/* Teacher Selection */}
                          <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>Teacher *</Text>
                            <View style={styles.teacherSelector}>
                              <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.teacherScrollView}
                              >
                                <View style={styles.teacherRow}>
                                  {teachers && teachers.length > 0 ? (
                                    teachers.map((teacher) => {
                                      const teacherAuthId =
                                        teacher?.auth_User_Id ||
                                        teacher?.auth_user_id ||
                                        teacher?.auth_user_Id ||
                                        teacher?.authUserId ||
                                        teacher?.auth_id ||
                                        teacher?.authId;
                                      const isSelected = period.teacher_Id === teacherAuthId;

                                      return (
                                        <TouchableOpacity
                                          key={teacherAuthId || teacher?.id || teacher?.full_Name}
                                          onPress={() => {
                                            const newPeriods = [...values.periods];
                                            newPeriods[index].teacher_Id = teacherAuthId;
                                            setFieldValue('periods', newPeriods);
                                          }}
                                          style={[
                                            styles.teacherButton,
                                            isSelected
                                              ? styles.teacherButtonActive
                                              : styles.teacherButtonInactive,
                                          ]}
                                          activeOpacity={0.7}
                                        >
                                          <Text
                                            style={[
                                              styles.teacherButtonText,
                                              { color: isSelected ? '#F59E0B' : '#6B7280' },
                                            ]}
                                          >
                                            {teacher?.full_Name || teacher?.email || 'Unknown'}
                                          </Text>
                                        </TouchableOpacity>
                                      );
                                    })
                                  ) : (
                                    <Text style={styles.noTeachersText}>No teachers available</Text>
                                  )}
                                </View>
                              </ScrollView>
                            </View>
                            {touched.periods?.[index]?.teacher_Id &&
                              errors.periods?.[index]?.teacher_Id && (
                                <Text style={styles.errorText}>
                                  {errors.periods[index].teacher_Id}
                                </Text>
                              )}
                          </View>

                          {/* Start Time */}
                          <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>Start Time *</Text>
                            <TouchableOpacity
                              onPress={() => {
                                const date = new Date();
                                if (period.start_Time) {
                                  const [hours, minutes] = period.start_Time.split(':');
                                  date.setHours(parseInt(hours) || 8, parseInt(minutes) || 0, 0);
                                } else {
                                  // Default to 8:00 AM if no time is set
                                  date.setHours(8, 0, 0, 0);
                                }
                                setTempStartTime(date);
                                setShowStartTimePicker(index);
                              }}
                              style={styles.timePickerButton}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={[
                                  styles.timePickerButtonText,
                                  !period.start_Time && styles.timePickerButtonTextPlaceholder,
                                ]}
                              >
                                {period.start_Time || 'Select start time'}
                              </Text>
                            </TouchableOpacity>
                            {touched.periods?.[index]?.start_Time &&
                              errors.periods?.[index]?.start_Time && (
                                <Text style={styles.errorText}>
                                  {errors.periods[index].start_Time}
                                </Text>
                              )}
                            {/* Time Picker */}
                            {showStartTimePicker === index && (
                              <View style={styles.timePickerContainer}>
                                <DateTimePicker
                                  value={tempStartTime}
                                  mode="time"
                                  is24Hour={true}
                                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                  textColor="#111827"
                                  accentColor="#F59E0B"
                                  style={styles.dateTimePicker}
                                  onChange={(event, selectedTime) =>
                                    handleStartTimeChange(event, selectedTime, setFieldValue, index, values)
                                  }
                                />
                                {Platform.OS === 'ios' && (
                                  <View style={styles.timePickerActions}>
                                    <TouchableOpacity
                                      onPress={() => setShowStartTimePicker(null)}
                                      style={styles.timePickerActionButton}
                                      activeOpacity={0.7}
                                    >
                                      <Text style={styles.timePickerCancelText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      onPress={() => confirmStartTime(setFieldValue, index, values)}
                                      style={[styles.timePickerActionButton, { marginLeft: 12 }]}
                                      activeOpacity={0.7}
                                    >
                                      <Text style={styles.timePickerDoneText}>Done</Text>
                                    </TouchableOpacity>
                                  </View>
                                )}
                              </View>
                            )}
                          </View>

                          {/* End Time */}
                          <View style={styles.fieldContainer}>
                            <Text style={styles.fieldLabel}>End Time *</Text>
                            <TouchableOpacity
                              onPress={() => {
                                const date = new Date();
                                if (period.end_Time) {
                                  const [hours, minutes] = period.end_Time.split(':');
                                  date.setHours(parseInt(hours) || 9, parseInt(minutes) || 0, 0);
                                } else {
                                  // Default to 9:00 AM if no time is set, or 1 hour after start time if it exists
                                  if (period.start_Time) {
                                    const [startHours, startMinutes] = period.start_Time.split(':');
                                    const startHour = parseInt(startHours) || 8;
                                    const startMin = parseInt(startMinutes) || 0;
                                    // Add 1 hour to start time
                                    date.setHours(startHour + 1, startMin, 0, 0);
                                  } else {
                                    date.setHours(9, 0, 0, 0);
                                  }
                                }
                                setTempEndTime(date);
                                setShowEndTimePicker(index);
                              }}
                              style={styles.timePickerButton}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={[
                                  styles.timePickerButtonText,
                                  !period.end_Time && styles.timePickerButtonTextPlaceholder,
                                ]}
                              >
                                {period.end_Time || 'Select end time'}
                              </Text>
                            </TouchableOpacity>
                            {touched.periods?.[index]?.end_Time &&
                              errors.periods?.[index]?.end_Time && (
                                <Text style={styles.errorText}>
                                  {errors.periods[index].end_Time}
                                </Text>
                              )}
                            {/* Time Picker */}
                            {showEndTimePicker === index && (
                              <View style={styles.timePickerContainer}>
                                <DateTimePicker
                                  value={tempEndTime}
                                  mode="time"
                                  is24Hour={true}
                                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                  textColor="#111827"
                                  accentColor="#F59E0B"
                                  style={styles.dateTimePicker}
                                  onChange={(event, selectedTime) =>
                                    handleEndTimeChange(event, selectedTime, setFieldValue, index, values)
                                  }
                                />
                                {Platform.OS === 'ios' && (
                                  <View style={styles.timePickerActions}>
                                    <TouchableOpacity
                                      onPress={() => setShowEndTimePicker(null)}
                                      style={styles.timePickerActionButton}
                                      activeOpacity={0.7}
                                    >
                                      <Text style={styles.timePickerCancelText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      onPress={() => confirmEndTime(setFieldValue, index, values)}
                                      style={[styles.timePickerActionButton, { marginLeft: 12 }]}
                                      activeOpacity={0.7}
                                    >
                                      <Text style={styles.timePickerDoneText}>Done</Text>
                                    </TouchableOpacity>
                                  </View>
                                )}
                              </View>
                            )}
                          </View>
                        </View>
                      ))}

                        {touched.periods && errors.periods && typeof errors.periods === 'string' && (
                          <Text style={styles.errorText}>{errors.periods}</Text>
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
                          title={isCreating || isSubmitting ? 'Adding...' : 'Add Timetable'}
                          onPress={formikSubmit}
                          bgColor="#F59E0B"
                          textColor="#FFFFFF"
                          className="flex-1"
                          loading={isCreating || isSubmitting}
                          disabled={isCreating || isSubmitting || isLoadingTeachers || availableDays.length === 0}
                        />
                      </View>
                    </View>
                  </>
                );
              }}
            </Formik>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default addTimetable;

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
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
  daySelector: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  dayScrollView: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dayRow: {
    flexDirection: 'row',
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  dayButtonActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  dayButtonInactive: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  dayButtonText: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Medium',
  },
  noDaysText: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
    paddingVertical: 8,
  },
  teacherSelector: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  teacherScrollView: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  teacherRow: {
    flexDirection: 'row',
  },
  teacherButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  teacherButtonActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  teacherButtonInactive: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  teacherButtonText: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Medium',
  },
  noTeachersText: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
    paddingVertical: 8,
  },
  timePickerButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  timePickerButtonText: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Regular',
    color: '#111827',
  },
  timePickerButtonTextPlaceholder: {
    color: '#9CA3AF',
  },
  timePickerContainer: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 8,
    overflow: 'hidden',
    width: '100%',
    alignSelf: 'stretch',
  },
  dateTimePicker: {
    width: '100%',
    height: Platform.OS === 'ios' ? 200 : undefined,
    backgroundColor: '#FFFFFF',
  },
  timePickerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  timePickerActionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  timePickerCancelText: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
  },
  timePickerDoneText: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Medium',
    color: '#F59E0B',
  },
  errorText: {
    color: '#EF4444',
    fontSize: hp(1.3),
    marginTop: hp(0.5),
  },
  periodsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addPeriodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 6,
  },
  addPeriodButtonText: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-SemiBold',
    color: '#F59E0B',
  },
  periodCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'visible',
  },
  periodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  periodNumber: {
    fontSize: hp(1.6),
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  removePeriodButton: {
    padding: 4,
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

