import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';
import Pen from '../../assets/icons/Pen';
import Plus from '../../assets/icons/Plus';
import Button from '../../components/Button';
import ScreenWrapper from '../../components/ScreenWrapper';
import SearchBar from '../../components/SearchBar';
import StudentCardSkeleton from '../../components/skeletons/StudentCardSkeleton';
import { hp } from '../../helpers/common';
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

  // Sync local state when cache is invalidated
  useEffect(() => {
    if (initialData?.items) {
      setStudentsList(initialData.items);
      setOffset(initialData.items.length);
      setHasMore(initialData.items.length === PAGE_SIZE);
    }
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
          keyExtractor={(student, index) => getStudentKey(student, index)}
          renderItem={({ item: student }) => {
            return (
              <View
                key={getStudentKey(student, 0)}
                style={styles.card}
              >
                {/* Header with Student Name and Status */}
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderRow}>
                    {/* Student Image */}
                    {student.user_Image ? (
                      <Image
                        source={{ uri: student.user_Image }}
                        style={styles.avatar}
                        cachePolicy="disk"
                      />
                    ) : (
                      <View style={styles.avatar} />
                    )}
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
});
