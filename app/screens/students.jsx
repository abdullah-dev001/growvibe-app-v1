import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import Plus from '../../assets/icons/Plus';
import Button from '../../components/Button';
import ScreenWrapper from '../../components/ScreenWrapper';
import SearchBar from '../../components/SearchBar';
import StudentCardSkeleton from '../../components/skeletons/StudentCardSkeleton';
import { hp } from '../../helpers/common';
import { useGetStudentsByBranchAndClassPaginatedQuery, useLazyGetStudentsByBranchAndClassPaginatedQuery } from '../../redux/api/studentApi';

const students = () => {
  const router = useRouter();
  const { classId } = useLocalSearchParams();
  const { branchId } = useSelector((state) => state.auth);

  const PAGE_SIZE = 5;
  const [studentsList, setStudentsList] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);

  const { data: initialData, isFetching: isFetchingInitial, refetch } = useGetStudentsByBranchAndClassPaginatedQuery(
    { branchId, classId, offset: 0, limit: PAGE_SIZE },
    { skip: !branchId || !classId }
  );
  const [trigger, { isFetching, error: studentsError }] = useLazyGetStudentsByBranchAndClassPaginatedQuery();

  const getStudentKey = (s) => String(s?.auth_User_Id);

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
    // Minimum 1 second skeleton display
    const timer = setTimeout(() => {
      setShowSkeleton(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (studentsList.length === 0 && initialData?.items) {
      const items = initialData.items;
      setStudentsList(items);
      setOffset(items.length);
      setHasMore(items.length === PAGE_SIZE);
    } else if (studentsList.length === 0 && !isFetchingInitial && !initialData && branchId && classId) {
      loadPage(0, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialData, isFetchingInitial, branchId, classId]);

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

  const handleEdit = (student) => {
    // Navigate to edit screen or open modal
    console.log('Edit student:', student);
  };

  const handleDelete = (student) => {
    Alert.alert(
      'Delete Student',
      `Are you sure you want to delete ${student.student_Name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            // Handle delete logic
            console.log('Delete student:', student);
          }
        },
      ]
    );
  };

  const handleAddStudent = () => {
    router.push({
      pathname: "/screens/forms/addStudent",
      params: {
        classId: classId,
      },
    });
  };

  const getStatusColor = (status) => {
    return status ? '#10B981' : '#EF4444';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
          <Button
            title="Add Student"
            onPress={handleAddStudent}
            icon={<Plus size={hp(1.8)} color="#FFFFFF" strokeWidth={2} />}
            bgColor="#10B981"
            textColor="#FFFFFF"
            size="small"
          />
        </View>

        {/* Search Bar */}
        <SearchBar />

        {/* Student List Header */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            Student List
          </Text>
          <View style={styles.listDivider} />
        </View>

        {/* Student Cards */}
        <FlatList
          data={studentsList}
          keyExtractor={(student) => String(student.auth_User_Id)}
          renderItem={({ item: student }) => (
                <View
                  key={student.auth_User_Id}
                  style={styles.card}
                >
                  {/* Header with Student Name and Status */}
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderRow}>
                      {/* Student Image */}
                      <View style={styles.avatar} />
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

                  {/* Student Details */}
                  <View style={styles.cardSection}>
                    {/* Contact */}
                    <View style={styles.detailItem}>
                      <Text style={styles.cardLabel}>
                        Contact
                      </Text>
                      <Text style={styles.cardValue}>
                        {student.phone || "Not assigned yet..."}
                      </Text>
                    </View>

                    {/* Fee */}
                    <View style={styles.detailItem}>
                      <Text style={styles.cardLabel}>
                        Fee
                      </Text>
                      <Text style={styles.feeValue}>
                        {student.fee || 'Not assigned yet...'}
                      </Text>
                    </View>
                  </View>

                  {/* Created Date */}
                  <View style={styles.cardDateRow}>
                    <View style={styles.dateRow}>
                      <Text style={styles.dateText}>
                        Created: {formatDate(student.created_at)}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.cardActions}>
                    {/* Primary Actions */}
                    <View style={styles.primaryActions}>
                      <TouchableOpacity
                        onPress={() => handleEdit(student)}
                        style={styles.actionButton}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.editButtonText}>
                          Edit
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleDelete(student)}
                        style={[styles.deleteButton, { marginLeft: 8 }]}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.deleteButtonText}>
                          Delete
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Additional Action Buttons */}
                    <View style={styles.secondaryActions}>
                      <TouchableOpacity
                        onPress={() => console.log('View profile:', student)}
                        style={[styles.secondaryButton, styles.profileButton]}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.profileButtonText}>
                          Profile
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => console.log('View payments:', student)}
                        style={[styles.secondaryButton, styles.paymentsButton, { marginLeft: 8 }]}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.paymentsButtonText}>
                          Payments
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
          )}
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
                  No students found. Create your first student to get started.
                </Text>
                <Button
                  title="Add Student"
                  onPress={handleAddStudent}
                  size="small"
                  bgColor="#10B981"
                  textColor="#FFFFFF"
                  icon={<Plus size={hp(2)} color={'#FFFFFF'} strokeWidth={2} />}
                />
              </View>
            ) : null
          }
          ListFooterComponent={
            studentsList.length > 0 && !isRefreshing && isLoadingMore ? (
              <StudentCardSkeleton />
            ) : null
          }
          removeClippedSubviews
          initialNumToRender={PAGE_SIZE}
          windowSize={PAGE_SIZE * 2}
        />
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
  feeValue: {
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
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  deleteButtonText: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Medium',
    color: '#EF4444',
  },
  secondaryActions: {
    flexDirection: 'row',
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    width: '100%',
    justifyContent: 'flex-end',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  profileButton: {
    backgroundColor: '#F3E8FF',
  },
  profileButtonText: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Medium',
    color: '#8B5CF6',
  },
  paymentsButton: {
    backgroundColor: '#EFF6FF',
  },
  paymentsButtonText: {
    fontSize: hp(1.3),
    fontFamily: 'Poppins-Medium',
    color: '#3B82F6',
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
});
