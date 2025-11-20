import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import Plus from '../../assets/icons/Plus';
import Button from '../../components/Button';
import ScreenWrapper from '../../components/ScreenWrapper';
import SignedAvatar from '../../components/SignedAvatar';
import { hp } from '../../helpers/common';
import { useGetAttendanceByDateAndBranchQuery, useGetAttendanceByDateAndClassQuery } from '../../redux/api/attendanceApi';
import { useGetTeachersByBranchQuery } from '../../redux/api/teacherApi';

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

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'present':
      return '#10B981';
    case 'absent':
      return '#EF4444';
    case 'late':
      return '#F59E0B';
    case 'leave':
      return '#3B82F6';
    default:
      return '#6B7280';
  }
};

const getStatusBgColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'present':
      return '#D1FAE5';
    case 'absent':
      return '#FEE2E2';
    case 'late':
      return '#FEF3C7';
    case 'leave':
      return '#DBEAFE';
    default:
      return '#F3F4F6';
  }
};

const attendance = () => {
  const router = useRouter();
  const { classId: classIdFromParams, role: roleFromParams } = useLocalSearchParams();
  const { branchId, classId: classIdFromRedux, schoolId, user } = useSelector((state) => state.auth);
  const attendanceRole = roleFromParams || 'student'; // 'teacher' or 'student'
  const isTeacherRole = attendanceRole === 'teacher';
  const isTeacher = user?.role === 'teacher';
  const classId = isTeacherRole ? null : (isTeacher ? classIdFromRedux : (classIdFromParams || classIdFromRedux));
  const canAddAttendance = isTeacherRole
    ? user?.role === 'coordinator'
    : user?.role === 'teacher' || user?.role === 'coordinator';

  const [selectedDate, setSelectedDate] = useState(formatDateForInput(new Date()));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(() => {
    const today = new Date();
    return today;
  });

  // Update tempDate when selectedDate changes
  React.useEffect(() => {
    if (selectedDate) {
      setTempDate(new Date(selectedDate));
    }
  }, [selectedDate]);

  const {
    data: branchTeachers,
    isLoading: isLoadingTeachers,
    error: teacherRosterError,
  } = useGetTeachersByBranchQuery(branchId, {
    skip: !branchId || !isTeacherRole,
  });

  // For students: use classId, for teachers: use branchId and role
  const {
    data: attendanceDataByClass,
    isLoading: isLoadingAttendanceByClass,
    error: attendanceErrorByClass,
    refetch: refetchByClass,
  } = useGetAttendanceByDateAndClassQuery(
    { date: selectedDate, class_Id: classId },
    { skip: !selectedDate || !classId || isTeacherRole }
  );

  const {
    data: attendanceDataByBranch,
    isLoading: isLoadingAttendanceByBranch,
    error: attendanceErrorByBranch,
    refetch: refetchByBranch,
  } = useGetAttendanceByDateAndBranchQuery(
    { date: selectedDate, branch_Id: branchId, role: 'teacher' },
    { skip: !selectedDate || !branchId || !isTeacherRole }
  );

  const attendanceData = isTeacherRole ? attendanceDataByBranch : attendanceDataByClass;
  const isLoadingAttendance = isTeacherRole ? isLoadingAttendanceByBranch : isLoadingAttendanceByClass;
  const attendanceError = isTeacherRole ? attendanceErrorByBranch : attendanceErrorByClass;
  const refetch = isTeacherRole ? refetchByBranch : refetchByClass;

  const rosterMap = useMemo(() => {
    if (!branchTeachers || !isTeacherRole) return new Map();
    const map = new Map();
    branchTeachers.forEach((teacher) => {
      const id = teacher?.auth_User_Id || teacher?.user_Id;
      if (id) {
        map.set(String(id), teacher);
      }
    });
    return map;
  }, [branchTeachers, isTeacherRole]);

  const pendingTeachers = useMemo(() => {
    if (!isTeacherRole) return [];
    const roster = branchTeachers || [];
    if (roster.length === 0) return [];
    const markedIds = new Set(
      (attendanceData || []).map((record) => String(record.user_Id))
    );
    return roster.filter(
      (teacher) => !markedIds.has(String(teacher.auth_User_Id || teacher.user_Id))
    );
  }, [isTeacherRole, branchTeachers, attendanceData]);

  // Check if attendance exists for selected date
  const today = formatDateForInput(new Date());
  const attendanceExistsForSelectedDate = attendanceData && attendanceData.length > 0;
  const attendanceExistsForToday = selectedDate === today && attendanceExistsForSelectedDate;
  
  // Get unique attendance_id from the data (all records for same date have same attendance_id)
  const attendanceId = attendanceData && attendanceData.length > 0 ? attendanceData[0].attendance_id : null;

  React.useEffect(() => {
    if (attendanceError) {
      Alert.alert('Error', attendanceError?.data?.message || 'Failed to load attendance');
    }
  }, [attendanceError]);

  React.useEffect(() => {
    if (teacherRosterError) {
      Alert.alert('Error', teacherRosterError?.data?.message || 'Failed to load teachers');
    }
  }, [teacherRosterError]);

  // Refetch attendance when screen comes into focus (e.g., after marking attendance)
  useFocusEffect(
    useCallback(() => {
      if (refetch) {
        refetch();
      }
    }, [refetch])
  );

  const buildAttendanceParams = (extra = {}) => {
    const params = {
      date: selectedDate,
      role: attendanceRole,
      ...extra,
    };
    if (!isTeacherRole && classId) {
      params.classId = classId;
    }
    return params;
  };

  const handleAddAttendance = () => {
    router.push({
      pathname: '/screens/forms/addAttendance',
      params: buildAttendanceParams(),
    });
  };

  const handleEditAttendance = () => {
    if (!attendanceId || !selectedDate) return;
    router.push({
      pathname: '/screens/forms/addAttendance',
      params: buildAttendanceParams({ attendanceId }),
    });
  };

  const handleDateChange = (daysOffset) => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + daysOffset);
    setSelectedDate(formatDateForInput(currentDate));
    setTempDate(currentDate);
  };

  const handleToday = () => {
    const todayDate = new Date();
    setSelectedDate(formatDateForInput(todayDate));
    setTempDate(todayDate);
  };

  const handleDatePickerChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setTempDate(selectedDate);
      if (Platform.OS === 'android') {
        setSelectedDate(formatDateForInput(selectedDate));
      }
    }
  };

  const confirmDate = () => {
    setSelectedDate(formatDateForInput(tempDate));
    setShowDatePicker(false);
  };

  const renderAttendanceItem = ({ item }) => {
    const statusColor = getStatusColor(item.status);
    const statusBgColor = getStatusBgColor(item.status);
    const teacherData = isTeacherRole ? rosterMap.get(String(item.user_Id)) : null;
    const displayName = teacherData?.full_Name || item.user_full_name || 'N/A';
    const displayEmail = teacherData?.email || item.user_email || 'No email';
    const avatarUrl = teacherData?.user_Image || teacherData?.user_image || null;

    return (
      <View style={styles.attendanceCard}>
        <View style={styles.cardHeader}>
          <View style={styles.studentInfo}>
            <SignedAvatar
              imageUrl={avatarUrl}
              placeholderLabel={displayName || displayEmail || 'S'}
              size={hp(5)}
            />
            <View style={styles.studentDetails}>
              <Text style={styles.studentName}>{displayName}</Text>
              <Text style={styles.studentEmail}>{displayEmail}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusBgColor }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status?.toUpperCase() || 'N/A'}
            </Text>
          </View>
        </View>

        {item.marked_by_full_name && (
          <View style={styles.markedByInfo}>
            <Text style={styles.markedByLabel}>Marked by:</Text>
            <Text style={styles.markedByText}>
              {item.marked_by_full_name} ({item.marked_by_role || 'N/A'})
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyState = () => {
    if (isLoadingAttendance) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Loading attendance...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>
          No attendance records found for {formatDateForDisplay(selectedDate)}
        </Text>
        {canAddAttendance && !attendanceExistsForSelectedDate && (
          <Button
            title="Mark Attendance"
            onPress={handleAddAttendance}
            bgColor="#1CACF3"
            textColor="#FFFFFF"
            size="small"
            style={styles.emptyButton}
          />
        )}
      </View>
    );
  };

  const renderPendingSection = () => {
    if (!isTeacherRole) return null;
    if (isLoadingTeachers) {
      return (
        <View style={styles.pendingSection}>
          <Text style={styles.sectionTitle}>Pending Teachers</Text>
          <Text style={styles.pendingSubtitle}>Loading teachers...</Text>
        </View>
      );
    }

    if (!pendingTeachers || pendingTeachers.length === 0) {
      return (
        <View style={styles.pendingSection}>
          <Text style={styles.sectionTitle}>Pending Teachers</Text>
          <Text style={styles.pendingSubtitle}>All teachers have been marked for this date.</Text>
        </View>
      );
    }

    return (
      <View style={styles.pendingSection}>
        <View style={styles.pendingHeader}>
          <Text style={styles.sectionTitle}>Pending Teachers</Text>
          <Text style={styles.pendingCount}>{pendingTeachers.length} pending</Text>
        </View>
        {pendingTeachers.map((teacher) => {
          const teacherId = teacher.auth_User_Id || teacher.user_Id;
          return (
            <View key={teacherId} style={styles.pendingCard}>
              <View style={styles.cardHeader}>
                <View style={styles.studentInfo}>
                  <SignedAvatar
                    imageUrl={teacher.user_Image || teacher.user_image}
                    placeholderLabel={teacher.full_Name || teacher.email || 'T'}
                    size={hp(5)}
                  />
                  <View style={styles.studentDetails}>
                    <Text style={styles.studentName}>{teacher.full_Name || 'N/A'}</Text>
                    <Text style={styles.studentEmail}>{teacher.email || 'No email'}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, styles.pendingBadge]}>
                  <Text style={[styles.statusText, styles.pendingStatusText]}>NOT MARKED</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>
              {isTeacherRole ? 'Teacher Attendance' : 'Attendance'}
            </Text>
            <Text style={styles.subTitle}>
              {isTeacherRole 
                ? 'View and manage teacher attendance' 
                : 'View and manage student attendance'}
            </Text>
          </View>
          {canAddAttendance && !isLoadingAttendance && !attendanceExistsForSelectedDate && (
            <Button
              title="Add Attendance"
              onPress={handleAddAttendance}
              icon={<Plus size={hp(1.8)} color="#FFFFFF" strokeWidth={2} />}
              bgColor="#1CACF3"
              textColor="#FFFFFF"
              size="small"
            />
          )}
        </View>

        {/* Date Selector */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>Select Date</Text>
          <TouchableOpacity
            onPress={() => {
              if (selectedDate) {
                setTempDate(new Date(selectedDate));
              } else {
                setTempDate(new Date());
              }
              setShowDatePicker(true);
            }}
            style={styles.datePickerButton}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.datePickerButtonText,
                { color: selectedDate ? '#111827' : '#9CA3AF' }
              ]}
            >
              {selectedDate ? formatDateForDisplay(selectedDate) : 'Select date'}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'compact' : 'default'}
                onChange={handleDatePickerChange}
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
                    onPress={confirmDate}
                    style={[styles.datePickerActionButton, styles.datePickerActionButtonMargin]}
                  >
                    <Text style={styles.datePickerDoneText}>Done</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Edit Button - Show only when attendance exists */}
        {canAddAttendance && attendanceExistsForSelectedDate && (
          <View style={styles.editButtonContainer}>
            <Button
              title="Edit Attendance"
              onPress={handleEditAttendance}
              bgColor="#10B981"
              textColor="#FFFFFF"
              size="small"
            />
          </View>
        )}

        {/* Attendance Summary */}
        {attendanceData && attendanceData.length > 0 && (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={styles.summaryValue}>{attendanceData.length}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Present</Text>
              <Text style={[styles.summaryValue, { color: '#10B981' }]}>
                {attendanceData.filter((a) => a.status?.toLowerCase() === 'present').length}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Absent</Text>
              <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
                {attendanceData.filter((a) => a.status?.toLowerCase() === 'absent').length}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Late</Text>
              <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>
                {attendanceData.filter((a) => a.status?.toLowerCase() === 'late').length}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Leave</Text>
              <Text style={[styles.summaryValue, { color: '#3B82F6' }]}>
                {attendanceData.filter((a) => a.status?.toLowerCase() === 'leave').length}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {isTeacherRole ? 'Marked Teachers' : 'Marked Students'}
          </Text>
          <Text style={styles.pendingSubtitle}>
            {attendanceData?.length || 0} marked
          </Text>
        </View>

        {/* Attendance List */}
        <FlatList
          data={attendanceData || []}
          keyExtractor={(item, index) => `${item.attendance_id}-${item.user_Id}-${index}`}
          renderItem={renderAttendanceItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderPendingSection}
          refreshing={isLoadingAttendance}
          onRefresh={refetch}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </ScreenWrapper>
  );
};

export default attendance;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: hp(2.5),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
  },
  subTitle: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    marginTop: hp(0.5),
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: hp(1.6),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    marginBottom: 8,
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
  editButtonContainer: {
    marginBottom: 16,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: hp(2),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: hp(1.8),
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
  },
  pendingSubtitle: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  listContent: {
    paddingBottom: 16,
  },
  attendanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  studentDetails: {
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
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-SemiBold',
  },
  markedByInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  markedByLabel: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    marginRight: 4,
  },
  markedByText: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Medium',
    color: '#111827',
  },
  pendingSection: {
    marginTop: 24,
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pendingCount: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-SemiBold',
    color: '#6B7280',
  },
  pendingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pendingBadge: {
    backgroundColor: '#F3F4F6',
  },
  pendingStatusText: {
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: hp(1.6),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyButton: {
    marginTop: 8,
  },
});
