import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import ArrowDown from '../../assets/icons/ArrowDown';
import ArrowUp from '../../assets/icons/ArrowUp';
import Calendar from '../../assets/icons/Calendar';
import Pen from '../../assets/icons/Pen';
import Plus from '../../assets/icons/Plus';
import Button from '../../components/Button';
import ScreenWrapper from '../../components/ScreenWrapper';
import SearchBar from '../../components/SearchBar';
import SignedAvatar from '../../components/SignedAvatar';
import TeacherCardSkeleton from '../../components/skeletons/TeacherCardSkeleton';
import { hp } from '../../helpers/common';
import { useGetTeacherMonthlyAnalyticsQuery } from '../../redux/api/attendanceApi';
import { useGetTeachersByBranchPaginatedQuery, useLazyGetTeachersByBranchPaginatedQuery } from '../../redux/api/teacherApi';

const teachers = () => {
  const router = useRouter();
  const { branchId } = useSelector((state) => state.auth);

  const PAGE_SIZE = 5;
  const [teachersList, setTeachersList] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);
  
  // Month selector state for analytics
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [expandedTeacherId, setExpandedTeacherId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: initialData, isFetching: isFetchingInitial, refetch } = useGetTeachersByBranchPaginatedQuery(
    { branchId, offset: 0, limit: PAGE_SIZE },
    { skip: !branchId }
  );
  const [trigger, { isFetching, error: teachersError }] = useLazyGetTeachersByBranchPaginatedQuery();

  const getTeacherKey = (t) => String(t?.auth_User_Id);

  const loadPage = async (nextOffset = 0, refresh = false) => {
    if (!branchId) return;
    try {
      const result = await trigger({ branchId, offset: nextOffset, limit: PAGE_SIZE }).unwrap();
      const items = result?.items || [];

      setTeachersList((prev) => {
        if (refresh || nextOffset === 0) return items;
        const existing = new Set(prev.map(getTeacherKey));
        const merged = [...prev, ...items.filter((i) => !existing.has(getTeacherKey(i)))];
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
  if (teachersError) {
    Alert.alert('Error', teachersError.message || 'Failed to load teachers');
  }
  }, [teachersError]);

  useEffect(() => {
    // Minimum 1 second skeleton display
    const timer = setTimeout(() => {
      setShowSkeleton(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (teachersList.length === 0 && initialData?.items) {
      const items = initialData.items;
      setTeachersList(items);
      setOffset(items.length);
      setHasMore(items.length === PAGE_SIZE);
    } else if (teachersList.length === 0 && !isFetchingInitial && !initialData && branchId) {
      loadPage(0, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isFetchingInitial, branchId]);

  // Sync local state when cache is invalidated
  useEffect(() => {
    if (initialData?.items) {
      setTeachersList(initialData.items);
      setOffset(initialData.items.length);
      setHasMore(initialData.items.length === PAGE_SIZE);
    }
  }, [initialData]);

  const handleRefresh = async () => {
    if (isRefreshing || !branchId) return;
    setIsRefreshing(true);
    setHasMore(true);
    setOffset(0);
    try {
      const res = await refetch();
      const items = res?.data?.items || [];
      setTeachersList(items);
      setOffset(items.length);
      setHasMore(items.length === PAGE_SIZE);
    } catch (e) {
      // ignore, alert handled above
    }
    setIsRefreshing(false);
  };

  const handleEndReached = () => {
    if (isRefreshing || !branchId) return;
    if (isFetching || isLoadingMore) return;
    if (!hasMore) return;
    setIsLoadingMore(true);
    loadPage(offset, false).finally(() => setIsLoadingMore(false));
  };

  const handleEdit = (teacher) => {
    const authId = teacher.auth_User_Id;
    if (!authId) {
      Alert.alert('Error', 'Teacher auth ID not available');
      return;
    }
    router.push({
      pathname: '/screens/forms/addTeacher',
      params: { teacherId: authId },
    });
  };

  const handleAddTeacher = () => {
    router.push('/screens/forms/addTeacher');
  };

  const handleManageAttendance = () => {
    router.push({
      pathname: '/screens/attendance',
      params: {
        role: 'teacher',
      },
    });
  };

  const getStatusColor = (status) => {
    return status ? '#10B981' : '#EF4444';
  };

  // Filter teachers based on search query
  const filteredTeachersList = React.useMemo(() => {
    if (!searchQuery.trim()) return teachersList;
    const query = searchQuery.toLowerCase().trim();
    return teachersList.filter((teacher) => {
      const name = (teacher.full_Name || '').toLowerCase();
      const email = (teacher.email || '').toLowerCase();
      const phone = (teacher.phone || '').toLowerCase();
      return name.includes(query) || email.includes(query) || phone.includes(query);
    });
  }, [teachersList, searchQuery]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Teacher Card Component with Analytics
  const TeacherCardWithAnalytics = ({
    teacher,
    selectedMonth,
    selectedYear,
    isExpanded,
    onToggleExpand,
    onShowMonthPicker,
    getStatusColor,
    handleEdit,
  }) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const { data: monthlyAnalytics, isLoading: isLoadingAnalytics } = useGetTeacherMonthlyAnalyticsQuery(
      {
        p_user_id: teacher.auth_User_Id,
        p_role: 'teacher',
        p_month: selectedMonth,
        p_year: selectedYear,
      },
      { skip: !teacher.auth_User_Id || !isExpanded }
    );

  return (
      <View style={styles.card}>
                  {/* Header with Image, Name and Status */}
                  <View style={styles.cardHeader}>
                    <SignedAvatar
                      imageUrl={teacher.user_Image || teacher.user_image}
                      style={styles.avatar}
                      placeholderLabel={teacher.full_Name || teacher.email || 'T'}
                    />
                    <View style={styles.cardHeaderContent}>
                      <Text style={styles.cardTitle}>
                        {teacher.full_Name || 'N/A'}
                      </Text>
                      <Text style={styles.cardSubtitle}>
                        {teacher.email || 'No email'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: teacher.profile_Status ? '#D1FAE5' : '#FEE2E2' }
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(teacher.profile_Status) }
                        ]}
                      >
                        {teacher.profile_Status ? 'Active' : 'Inactive'}
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
            <Text style={styles.expandIcon}>{isExpanded ?
            <ArrowUp size={hp(2)} color="#374151" strokeWidth={2} /> : <ArrowDown size={hp(2)} color="#374151" strokeWidth={2} />}</Text>
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

                  {/* Teacher Details */}
                  <View style={styles.cardSection}>
                    <View style={styles.detailItem}>
                      <Text style={styles.cardLabel}>
                        Contact
                      </Text>
                      <Text style={styles.cardValue}>
                        {teacher.phone || "Not assigned yet..."}
                      </Text>
                    </View>
                    
                    <View style={styles.detailItem}>
                      <Text style={styles.cardLabel}>
                        Salary
                      </Text>
                      <Text style={styles.salaryValue}>
                        {teacher.salary || 'Not assigned yet...'}
                      </Text>
                    </View>
                  </View>

                  {/* Created Date */}
                  <View style={styles.cardDateRow}>
                    <View style={styles.dateRow}>
                      <Text style={styles.dateText}>
                        Created: {formatDate(teacher.created_at)}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.cardActions}>
                    {/* Primary Actions */}
                    <View style={styles.primaryActions}>
                      <TouchableOpacity
                        onPress={() => handleEdit(teacher)}
                        style={styles.actionButton}
                        activeOpacity={0.7}
                      >
                        <Pen size={hp(1.6)} color="#1CACF3" strokeWidth={2} />
                        <Text style={styles.editButtonText}>
                          Edit
                        </Text>
                      </TouchableOpacity>
                    </View>
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
              Teachers
            </Text>
            <Text style={styles.subTitle}>
              Manage school teachers
            </Text>
          </View>
          <Button
            title="Add Teacher"
            onPress={handleAddTeacher}
            icon={<Plus size={hp(1.8)} color="#FFFFFF" strokeWidth={2} />}
            bgColor="#F97316"
            textColor="#FFFFFF"
            size="small"
          />
        </View>

        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search teachers by name, email, or phone..."
        />

        {/* Manage Attendance Button */}
        <View style={styles.manageAttendanceContainer}>
          <Button
            title="Manage Attendance"
            onPress={handleManageAttendance}
            bgColor="#10B981"
            textColor="#FFFFFF"
            size="small"
          />
        </View>

        {/* Teacher List Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            Teacher List
          </Text>
          <View style={styles.listDivider} />
        </View>

        {/* Teacher Cards */}
        <FlatList
          data={filteredTeachersList}
          keyExtractor={(teacher) => String(teacher.auth_User_Id)}
          renderItem={({ item: teacher }) => {
            const isExpanded = expandedTeacherId === teacher.auth_User_Id;
            return (
              <TeacherCardWithAnalytics
                key={teacher.auth_User_Id}
                teacher={teacher}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                isExpanded={isExpanded}
                onToggleExpand={() => {
                  setExpandedTeacherId(isExpanded ? null : teacher.auth_User_Id);
                }}
                onShowMonthPicker={() => setShowMonthPicker(true)}
                getStatusColor={getStatusColor}
                handleEdit={handleEdit}
              />
            );
          }}
          contentContainerStyle={styles.scrollContent}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.1}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            (showSkeleton || isFetchingInitial || isFetching || (teachersList.length === 0 && !initialData)) && !isRefreshing ? (
              <>
                {Array.from({ length: 3 }).map((_, index) => (
                  <TeacherCardSkeleton key={index} />
                ))}
              </>
            ) : teachersList.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No teachers found. Create your first teacher to get started.
                </Text>
                <Button
                  title="Add Teacher"
                  onPress={handleAddTeacher}
                  size="small"
                  bgColor="#F97316"
                  textColor="#FFFFFF"
                  icon={<Plus size={hp(2)} color={'#FFFFFF'} strokeWidth={2} />}
                />
              </View>
            ) : filteredTeachersList.length === 0 && searchQuery ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No teachers found matching "{searchQuery}".
                </Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            teachersList.length > 0 && !isRefreshing && isLoadingMore ? (
              <TeacherCardSkeleton />
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

export default teachers;

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
  manageAttendanceContainer: {
    marginVertical: 16,
    width: '100%',
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
    fontFamily: 'Poppins-SemiBold',
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
    marginBottom: 12,
  },
  avatar: {
    width: hp(6),
    height: hp(6),
    backgroundColor: '#E5E7EB',
    borderRadius: 9999,
    marginRight: 12,
  },
  cardHeaderContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: hp(1.8),
    fontFamily: 'Poppins-SemiBold',
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
  cardSection: {
    marginBottom: 16,
  },
  detailItem: {
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
    marginBottom: hp(0.3),
  },
  cardValue: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-Regular',
    color: '#111827',
  },
  salaryValue: {
    fontSize: hp(1.4),
    fontFamily: 'Poppins-SemiBold',
    color: '#10B981',
  },
  cardDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: hp(1.2),
    fontFamily: 'Poppins-Medium',
    color: '#6B7280',
  },
  cardActions: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  primaryActions: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  editButtonText: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Medium',
    color: '#1CACF3',
    marginLeft: hp(0.5),
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
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: hp(2.5),
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
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
