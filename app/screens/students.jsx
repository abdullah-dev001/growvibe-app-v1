import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import Calendar from '../../assets/icons/Calendar';
import Pen from '../../assets/icons/Pen';
import Plus from '../../assets/icons/Plus';
import Button from '../../components/Button';
import ScreenWrapper from '../../components/ScreenWrapper';
import SearchBar from '../../components/SearchBar';
import SignedAvatar from '../../components/SignedAvatar';
import StudentCardSkeleton from '../../components/skeletons/StudentCardSkeleton';
import { hp } from '../../helpers/common';
import { useGetStudentMonthlyAnalyticsQuery } from '../../redux/api/attendanceApi';
import { useGetStudentsByBranchAndClassPaginatedQuery, useLazyGetStudentsByBranchAndClassPaginatedQuery } from '../../redux/api/studentApi';

const students = () => {
  const router = useRouter();
  const { classId: classIdFromParams } = useLocalSearchParams();
  const { branchId, classId: classIdFromRedux, schoolId, user } = useSelector((state) => state.auth);
  // For teachers, use classId from Redux store only. For other roles, use params if available.
  const isTeacher = user?.role === 'teacher';
  const classId = isTeacher ? classIdFromRedux : (classIdFromParams || classIdFromRedux);
  const isStudent = user?.role === 'student';

  const PAGE_SIZE = 5;
  const [studentsList, setStudentsList] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  
  // Month selector state for analytics
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [expandedStudentId, setExpandedStudentId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: initialData, isFetching: isFetchingInitial, refetch } = useGetStudentsByBranchAndClassPaginatedQuery(
    { branchId, classId, offset: 0, limit: PAGE_SIZE },
    { skip: !branchId || !classId }
  );
  const [trigger, { isFetching, error: studentsError }] = useLazyGetStudentsByBranchAndClassPaginatedQuery();

  const getStudentKey = (s, index) => {
    // Use email as key since we only fetch limited fields
    if (s?.email) return String(s.email);
    return `student-${index}`;
  };

  const loadPage = async (nextOffset = 0, refresh = false) => {
    if (!branchId || !classId) return;
    try {
      const result = await trigger({ branchId, classId, offset: nextOffset, limit: PAGE_SIZE }).unwrap();
      const items = result?.items || [];

      setStudentsList((prev) => {
        if (refresh || nextOffset === 0) return items;
        const existing = new Set(prev.map(getStudentKey));
        const merged = [...prev, ...items.filter((i) => !existing.has(getStudentKey(i)))];
        return merged;
      });
      const newOffset = nextOffset + items.length;
      setOffset(newOffset);
      setHasMore(items.length === PAGE_SIZE);
    } catch (e) {
      // handled by error alert
    }
  };

  useEffect(() => {
    if (studentsError) {
      Alert.alert('Error', studentsError.message || 'Failed to load students');
    }
  }, [studentsError]);

  useEffect(() => {
    // Show skeleton for minimum 1s only on cold load (no cached data)
    if (!initialData?.items?.length) {
      setShowSkeleton(true);
      const timer = setTimeout(() => {
        setShowSkeleton(false);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setShowSkeleton(false);
    }
  }, [initialData]);

  // Reset state when classId or branchId changes
  useEffect(() => {
    setStudentsList([]);
    setOffset(0);
    setHasMore(true);
    setExpandedStudentId(null);
  }, [classId, branchId]);

  useEffect(() => {
    // Only populate if we have data and the list is empty (fresh load or after reset)
    if (studentsList.length === 0 && initialData?.items && branchId && classId) {
      const items = initialData.items;
      setStudentsList(items);
      setOffset(items.length);
      setHasMore(items.length === PAGE_SIZE);
    } else if (studentsList.length === 0 && !isFetchingInitial && !initialData && branchId && classId) {
      // If no cached data, trigger a fetch
      loadPage(0, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isFetchingInitial, branchId, classId]);

  // Sync local state when cache is invalidated (only for first page to avoid overwriting paginated data)
  useEffect(() => {
    if (initialData?.items && branchId && classId && offset <= PAGE_SIZE) {
      // Only sync if we're on the first page to avoid overwriting paginated data
      // This ensures updates are reflected when coming back from edit
      setStudentsList(initialData.items);
      setOffset(initialData.items.length);
      setHasMore(initialData.items.length === PAGE_SIZE);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData]);

  const handleRefresh = async () => {
    if (isRefreshing || !branchId || !classId) return;
    setIsRefreshing(true);
    setHasMore(true);
    setOffset(0);
    try {
      const res = await refetch();
      const items = res?.data?.items || [];
      setStudentsList(items);
      setOffset(items.length);
      setHasMore(items.length === PAGE_SIZE);
    } catch (e) {
      // ignore, alert handled above
    }
    setIsRefreshing(false);
  };

  const handleEndReached = () => {
    if (isRefreshing || !branchId || !classId) return;
    if (isFetching || isLoadingMore) return;
    if (!hasMore) return;
    setIsLoadingMore(true);
    loadPage(offset, false).finally(() => setIsLoadingMore(false));
  };

  const handleResult = (student) => {
    // Navigate to result screen with student ID and name
    // Only use auth_User_Id (UUID) - required for database query
    const studentId = student.auth_User_Id;
    const studentName = student.full_Name || 'Student';
    if (!studentId) {
      Alert.alert('Error', 'Student ID not available');
      return;
    }
    router.push({
      pathname: '/screens/result',
      params: {
        studentId: studentId,
        studentName: studentName,
      },
    });
  };

  const handleAddStudent = () => {
    router.push({
      pathname: '/screens/forms/addStudent',
      params: {
        classId: classId,
      },
    });
  };

  const handleEdit = (student) => {
    const authId = student.auth_User_Id;
    if (!authId) {
      Alert.alert('Error', 'Student auth ID not available');
      return;
    }
    router.push({
      pathname: '/screens/forms/addStudent',
      params: { 
        studentId: authId,
        classId: classId,
      },
    });
  };

  // Check if user can edit students (owner, principal, coordinator only)
  const canEditStudent = user?.role === 'owner' || user?.role === 'principal' || user?.role === 'coordinator';

  const getStatusColor = (status) => {
    return status ? '#10B981' : '#EF4444';
  };

  // Filter students based on search query
  const filteredStudentsList = React.useMemo(() => {
    if (!searchQuery.trim()) return studentsList;
    const query = searchQuery.toLowerCase().trim();
    return studentsList.filter((student) => {
      const name = (student.full_Name || '').toLowerCase();
      const email = (student.email || '').toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  }, [studentsList, searchQuery]);

  // Student Card Component with Analytics
  const StudentCardWithAnalytics = ({
    student,
    classId,
    selectedMonth,
    selectedYear,
    isExpanded,
    onToggleExpand,
    onShowMonthPicker,
    getStatusColor,
    handleResult,
    handleEdit,
    isStudent,
    canEditStudent,
    router,
    branchId,
    schoolId,
  }) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const { data: monthlyAnalytics, isLoading: isLoadingAnalytics } = useGetStudentMonthlyAnalyticsQuery(
      {
        p_class_id: classId,
        p_user_id: student.auth_User_Id,
        p_role: 'student',
        p_month: selectedMonth,
        p_year: selectedYear,
      },
      { skip: !classId || !student.auth_User_Id || !isExpanded }
    );

    return (
      <View style={styles.card}>
          {/* Header with Student Name and Status */}
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderRow}>
              {/* Student Image */}
              <SignedAvatar
                imageUrl={student.user_Image}
                style={styles.avatar}
                placeholderLabel={student.full_Name || student.email || 'S'}
              />
              <View style={styles.cardHeaderContent}>
                <Text style={styles.cardTitle}>
                  {student.full_Name || 'N/A'}
                </Text>
                <Text style={styles.cardSubtitle}>
                  {student.email || 'No email'}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: student.profile_Status ? '#D1FAE5' : '#FEE2E2' }
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(student.profile_Status) }
                ]}
              >
                {student.profile_Status ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          {/* Monthly Analytics Section */}
          <View style={styles.analyticsSection}>
            <TouchableOpacity
              onPress={onToggleExpand}
              style={styles.analyticsHeader}
              activeOpacity={0.7}
            >
              <Text style={styles.analyticsTitle}>Monthly Analytics</Text>
              <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
            </TouchableOpacity>
            
            {isExpanded && (
              <View style={styles.analyticsContent}>
                {/* Month/Year Selector */}
                <TouchableOpacity
                  onPress={onShowMonthPicker}
                  style={styles.monthSelector}
                  activeOpacity={0.7}
                >
                  <Text style={styles.monthSelectorText}>
                    {monthNames[selectedMonth - 1]} {selectedYear}
                  </Text>
                  <Calendar size={hp(2)} color="#374151" strokeWidth={2} />
                </TouchableOpacity>

                {/* Analytics Display */}
                {isLoadingAnalytics ? (
                  <Text style={styles.loadingText}>Loading analytics...</Text>
                ) : monthlyAnalytics ? (
                  <View style={styles.analyticsStats}>
                    <View style={styles.analyticsStatItem}>
                      <View style={[styles.analyticsCircle, styles.analyticsCircleGreen]}>
                        <Text style={styles.analyticsCircleText}>
                          {monthlyAnalytics.present_percent?.toFixed(1) || 0}%
                        </Text>
                      </View>
                      <Text style={styles.analyticsLabel}>Present</Text>
                      <Text style={styles.analyticsCount}>
                        {monthlyAnalytics.present || 0}/{monthlyAnalytics.total_days || 0}
                      </Text>
                    </View>
                    <View style={styles.analyticsStatItem}>
                      <View style={[styles.analyticsCircle, styles.analyticsCircleRed]}>
                        <Text style={styles.analyticsCircleText}>
                          {monthlyAnalytics.absent_percent?.toFixed(1) || 0}%
                        </Text>
                      </View>
                      <Text style={styles.analyticsLabel}>Absent</Text>
                      <Text style={styles.analyticsCount}>{monthlyAnalytics.absent || 0}</Text>
                    </View>
                    <View style={styles.analyticsStatItem}>
                      <View style={[styles.analyticsCircle, styles.analyticsCircleOrange]}>
                        <Text style={styles.analyticsCircleText}>
                          {monthlyAnalytics.late_percent?.toFixed(1) || 0}%
                        </Text>
                      </View>
                      <Text style={styles.analyticsLabel}>Late</Text>
                      <Text style={styles.analyticsCount}>{monthlyAnalytics.late || 0}</Text>
                    </View>
                    <View style={styles.analyticsStatItem}>
                      <View style={[styles.analyticsCircle, styles.analyticsCircleBlue]}>
                        <Text style={styles.analyticsCircleText}>
                          {monthlyAnalytics.leave_percent?.toFixed(1) || 0}%
                        </Text>
                      </View>
                      <Text style={styles.analyticsLabel}>Leave</Text>
                      <Text style={styles.analyticsCount}>{monthlyAnalytics.leave || 0}</Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.emptyText}>No analytics data available</Text>
                )}
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.cardActions}>
            <TouchableOpacity
              onPress={() => handleResult(student)}
              style={styles.resultButton}
              activeOpacity={0.7}
            >
              <Text style={styles.resultButtonText}>
                Result
              </Text>
            </TouchableOpacity>
            {!isStudent && (
              <TouchableOpacity
                onPress={() => {
                  const studentId = student.auth_User_Id;
                  const studentName = student.full_Name || 'Student';
                  if (!studentId) {
                    Alert.alert('Error', 'Student ID not available');
                    return;
                  }
                  router.push({
                    pathname: '/screens/fees',
                    params: {
                      studentId: studentId,
                      studentName: studentName,
                      branchId: branchId,
                      schoolId: schoolId,
                      classId: classId,
                    },
                  });
                }}
                style={[styles.resultButton, styles.feeButton]}
                activeOpacity={0.7}
              >
                <Text style={[styles.resultButtonText, styles.feeButtonText]}>
                  Fee
                </Text>
              </TouchableOpacity>
            )}
            {canEditStudent && (
              <TouchableOpacity
                onPress={() => handleEdit(student)}
                style={[styles.resultButton, styles.editButton]}
                activeOpacity={0.7}
              >
                <Pen size={hp(1.4)} color="#1CACF3" strokeWidth={2} />
                <Text style={[styles.resultButtonText, styles.editButtonText]}>
                  Edit
                </Text>
              </TouchableOpacity>
            )}
          </View>
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
              Students
            </Text>
            <Text style={styles.subTitle}>
              Manage school students
            </Text>
          </View>
          {!isStudent && (
            <Button
              title="Add Student"
              onPress={handleAddStudent}
              icon={<Plus size={hp(1.8)} color="#FFFFFF" strokeWidth={2} />}
              bgColor="#1CACF3"
              textColor="#FFFFFF"
              size="small"
            />
          )}
        </View>

        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search students by name or email..."
        />

        {/* Student List Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            Student List
          </Text>
          <View style={styles.listDivider} />
        </View>

        {/* Student Cards */}
        <FlatList
          data={filteredStudentsList}
          keyExtractor={(student, index) => getStudentKey(student, index)}
          renderItem={({ item: student }) => {
            const isExpanded = expandedStudentId === student.auth_User_Id;
            return (
              <StudentCardWithAnalytics
                key={getStudentKey(student, 0)}
                student={student}
                classId={classId}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                isExpanded={isExpanded}
                onToggleExpand={() => {
                  setExpandedStudentId(isExpanded ? null : student.auth_User_Id);
                }}
                onShowMonthPicker={() => setShowMonthPicker(true)}
                getStatusColor={getStatusColor}
                handleResult={handleResult}
                handleEdit={handleEdit}
                isStudent={isStudent}
                canEditStudent={canEditStudent}
                router={router}
                branchId={branchId}
                schoolId={schoolId}
              />
            );
          }}
          contentContainerStyle={styles.scrollContent}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.1}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            (showSkeleton || isFetchingInitial || isFetching || (studentsList.length === 0 && !initialData)) && !isRefreshing ? (
              <>
                {Array.from({ length: 3 }).map((_, index) => (
                  <StudentCardSkeleton key={index} />
                ))}
              </>
            ) : studentsList.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No students found.
                </Text>
              </View>
            ) : filteredStudentsList.length === 0 && searchQuery ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No students found matching "{searchQuery}".
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            studentsList.length > 0 && !isRefreshing && isLoadingMore && !searchQuery ? (
              <StudentCardSkeleton />
            ) : null
          }
          removeClippedSubviews
          initialNumToRender={PAGE_SIZE}
          windowSize={PAGE_SIZE * 2}
        />

        {/* Month/Year Picker Modal - Shared across all cards */}
        <Modal
          visible={showMonthPicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowMonthPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Month & Year</Text>
                <TouchableOpacity onPress={() => setShowMonthPicker(false)} style={styles.modalCloseButton}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalBody}>
                <View style={styles.pickerSection}>
                  <Text style={styles.pickerSectionTitle}>Month</Text>
                  <View style={styles.pickerGrid}>
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((month, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => {
                          setSelectedMonth(index + 1);
                          setShowMonthPicker(false);
                        }}
                        style={[
                          styles.pickerItem,
                          selectedMonth === index + 1 && styles.pickerItemSelected
                        ]}
                      >
                        <Text
                          style={[
                            styles.pickerItemText,
                            selectedMonth === index + 1 && styles.pickerItemTextSelected
                          ]}
                        >
                          {month}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={styles.pickerSection}>
                  <Text style={styles.pickerSectionTitle}>Year</Text>
                  <View style={styles.pickerGrid}>
                    {(() => {
                      const years = [];
                      const currentYear = currentDate.getFullYear();
                      for (let i = 0; i < 3; i++) {
                        years.push(currentYear - i);
                      }
                      return years;
                    })().map((year) => (
                      <TouchableOpacity
                        key={year}
                        onPress={() => {
                          setSelectedYear(year);
                          setShowMonthPicker(false);
                        }}
                        style={[
                          styles.pickerItem,
                          selectedYear === year && styles.pickerItemSelected
                        ]}
                      >
                        <Text
                          style={[
                            styles.pickerItemText,
                            selectedYear === year && styles.pickerItemTextSelected
                          ]}
                        >
                          {year}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </ScreenWrapper>
  );
};

export default students;

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
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  subTitle: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
    marginTop: hp(0.5),
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  listTitle: {
    color: '#6B7280',
    fontWeight: '600',
    letterSpacing: 0.5,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  listDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
    marginLeft: 12,
  },
  scrollContent: {
    paddingBottom: 56,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: hp(6),
    height: hp(6),
    backgroundColor: '#E5E7EB',
    borderRadius: 9999,
    marginRight: 12,
    resizeMode: 'cover',
  },
  cardHeaderContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: hp(1.8),
    fontFamily: 'Poppins-Bold',
    color: '#111827',
    marginBottom: hp(0.3),
  },
  cardSubtitle: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Regular',
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusText: {
    fontSize: hp(1.1),
    fontFamily: 'Poppins-Medium',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  resultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  resultButtonText: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Medium',
    color: '#1CACF3',
  },
  feeButton: {
    marginLeft: 8,
    backgroundColor: '#FEF3C7',
  },
  feeButtonText: {
    color: '#F59E0B',
  },
  editButton: {
    marginLeft: 8,
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonText: {
    color: '#1CACF3',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: hp(1.6),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
    marginBottom: hp(2),
    textAlign: 'center',
  },
  analyticsSection: {
    marginTop: 12,
    marginBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  analyticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  analyticsTitle: {
    fontSize: hp(1.6),
    fontFamily: 'Poppins-SemiBold',
    color: '#374151',
  },
  expandIcon: {
    fontSize: hp(1.4),
    color: '#6B7280',
  },
  analyticsContent: {
    marginTop: 8,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  monthSelectorText: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Medium',
    color: '#374151',
  },
  monthSelectorIcon: {
    fontSize: hp(1.8),
  },
  analyticsStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  analyticsStatItem: {
    alignItems: 'center',
    width: '22%',
    marginBottom: 12,
  },
  analyticsCircle: {
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    height: hp(5),
    width: hp(5),
    marginBottom: 6,
  },
  analyticsCircleGreen: {
    backgroundColor: '#10B981',
  },
  analyticsCircleRed: {
    backgroundColor: '#EF4444',
  },
  analyticsCircleOrange: {
    backgroundColor: '#F59E0B',
  },
  analyticsCircleBlue: {
    backgroundColor: '#3B82F6',
  },
  analyticsCircleText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-SemiBold',
    fontSize: hp(1.3),
  },
  analyticsLabel: {
    color: '#6B7280',
    fontFamily: 'Poppins-Medium',
    fontSize: hp(1.2),
    marginTop: 4,
  },
  analyticsCount: {
    color: '#9CA3AF',
    fontFamily: 'Poppins-Regular',
    fontSize: hp(1.1),
    marginTop: 2,
  },
  loadingText: {
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
    fontSize: hp(1.4),
    textAlign: 'center',
    paddingVertical: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: hp(2),
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: hp(2.5),
    color: '#6B7280',
  },
  modalBody: {
    padding: 16,
  },
  pickerSection: {
    marginBottom: 24,
  },
  pickerSectionTitle: {
    fontSize: hp(1.8),
    fontFamily: 'Poppins-SemiBold',
    color: '#374151',
    marginBottom: 12,
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    minWidth: '30%',
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#1CACF3',
  },
  pickerItemText: {
    fontSize: hp(1.5),
    fontFamily: 'Poppins-Medium',
    color: '#374151',
  },
  pickerItemTextSelected: {
    color: '#1CACF3',
    fontFamily: 'Poppins-SemiBold',
  },
});
